const express = require("express");
const fileUpload = require("express-fileupload");
const fs = require("fs");
const os = require("os");
const path = require("path");
const catalyst = require("zcatalyst-sdk-node");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
const unzipper = require('unzipper');
const csv = require("csv-parser");
const {createObjectCsvWriter} = require("csv-writer");
 const { v4: uuidv4 } = require("uuid");
const app = express();
// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// Middleware setup for JSON body parsing and file upload
app.use(express.json());
app.use(fileUpload());

app.use(
  cors({
    origin: "*", // Allows all origins, this is the default setting.
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);



const credentials = {
  USERConnector: {
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
    auth_url: process.env.auth_url,
    refresh_url: process.env.refresh_url,
    refresh_token: process.env.refresh_token,
  },
};


async function getZohoAccessToken(req) {
  const catalystApp = catalyst.initialize(req);
  const cache = catalystApp.cache().segment();

  let accessToken = await cache.get("USERConnector");
  // console.log("Token",accessToken);
  if (!accessToken.cache_value) {
    console.log("Access token not found in cache, generating a new one...");
    try {
      accessToken = await catalystApp
        .connection(credentials)
        .getConnector("USERConnector")
        .getAccessToken();

      if (accessToken) {
        await cache.put("USERConnector", accessToken, 1);
        console.log("New access token generated and cached.");
        return accessToken;
      }
    } catch (error) {
      console.error("Error generating Zoho access token:", error);
      return null;
    }
  } else {
    console.log("Using cached access token.");
  }

  return accessToken.cache_value;
}



// Catalyst Stratus buckets. Two separate buckets, because the two kinds of
// object have different access needs:
//   STRATUS_BUCKET - page HTML, written by the builder and streamed back to
//                    visitors through these functions, so it stays private.
//   MEDIA_BUCKET   - image/file uploads whose public object_url is embedded
//                    directly in page HTML, so it needs public read.
// Override either with the matching function env variable if a bucket is renamed.
const STRATUS_BUCKET = process.env.STRATUS_BUCKET || "fi-digital-pages";
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || "cms-file";

// Zoho org id used to resolve CREATORID -> user name.
const ZOHO_ORG_ID = process.env.ZOHO_ORG_ID || 10090242015;

const folderId = "1380000001397365"; // Legacy Catalyst Filestore folder (unused - pages now live in Stratus)


// API route to retrieve all pages' metadata
app.get("/pages", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    // Get user management instance
    const stratus = capp.stratus();
    const userManagement = capp.userManagement();

    // Fetch all users
    const users = await userManagement.getAllUsers(ZOHO_ORG_ID);

    // Create a map of userId to full name for easy lookup
    const userMap = users.reduce((acc, user) => {
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      acc[user.user_id] = fullName;
      return acc;
    }, {});

    // Fetch all pages metadata from Catalyst Datastore
    const zcql = capp.zcql();
    const query = `SELECT * FROM Pages`;
    const queryResp = await zcql.executeZCQLQuery(query);

    // Check if any pages were found
    if (!queryResp || queryResp.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pages found." });
    }

    // Map through the results to extract page details and replace CREATORID with the user's name
    const pages = queryResp.map((record) => {
      const page = record.Pages;
      const creatorName = userMap[page.CREATORID] || "Admin"; // Default to "Admin" if no match is found
      return {
        ...page,
        CreatedBy: creatorName, // Replace CREATORID with the corresponding user's name
      };
    });

    // Send the list of pages as a JSON response
    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("[/pages] error:", error);
    return res.status(500).json({ success: false, message: "Pages data not found" });
  }
});

//genrating the leads via form

app.post("/submit/form", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const leadsTable = capp.datastore().table("Leads");

    // console.log("Request Body:", req.body);
    const leadId = req.body.leadId; // If leadId is provided, update; otherwise, insert.
    const { pageId, otpVerified } = req.body;

    // console.log("Lead Body", req.body);

    // Prepare the data to be stored in the "Lead_data" field as JSON
    const leadData = {
      pageId,
      otpVerified,
      Lead_data: JSON.stringify(req.body), // Store entire body as JSON for insertion
    };

    // console.log("Lead Data:", leadData);

    if (leadId) {
      const zcql = capp.zcql();
      // Fetch the lead data using ZCQL
      const zcqlQuery = `SELECT * FROM Leads WHERE ROWID = '${leadId}'`;
      const existingLead = await zcql.executeZCQLQuery(zcqlQuery);

      // console.log("Existing Lead Data:", existingLead);

      if (existingLead.length > 0) {
        const existingLeadData = existingLead[0].Leads;

        // console.log("Inside the loop data", existingLeadData.Lead_data);

        // Safely parse the existing "Lead_data" JSON, adding error handling for invalid data
        let existingDataJson = {};
        try {
          if (existingLeadData.Lead_data) {
            existingDataJson = JSON.parse(existingLeadData.Lead_data); // Parse existing "Lead_data" JSON
          }
        } catch (error) {
          console.error("Error parsing existing Lead_data:", error);
          existingDataJson = {}; // Fallback to empty object if parsing fails
        }

        // Merge the new data with the existing lead data, preserving important fields
        const updatedData = preserveExistingData(existingDataJson, req.body);

        // Now, we need to make sure the merged data is correctly stored as JSON
        leadData.Lead_data = JSON.stringify(updatedData);

        // Update the lead record.
        leadData.ROWID = leadId; // Add ROWID for the update operation
        await leadsTable.updateRow(leadData);

        return res.status(200).json({
          success: true,
          message: "Lead data updated successfully",
          leadId: leadId,
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Lead not found for the provided leadId.",
        });
      }
    } else {
      // If leadId is not provided, insert a new lead record with the form data as JSON.
      const newLead = await leadsTable.insertRow(leadData);
      return res.status(201).json({
        success: true,
        message: "Lead data inserted successfully",
        leadId: newLead.ROWID,
      });
    }
  } catch (error) {
    console.error("Error handling form submission:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing the form submission.",
      // error: error.message,
    });
  }
});

// Helper function for merging existing data with new data
function preserveExistingData(existingData, newData) {
  // console.log("Raw existing data coming", existingData);
  const mergedData = { ...existingData }; // Start by copying the existing data

  // console.log("Existing data which is stored in the array", mergedData);

  for (const key in newData) {
    if (newData.hasOwnProperty(key)) {
      if (!(key in existingData)) {
        // console.log(`Adding new field: ${key} with value: ${newData[key]}`);
        mergedData[key] = newData[key]; // Add new field to merged data
      } else {
        // If the field exists, update it with the new value from newData

        mergedData[key] = newData[key]; // Update value with new data
      }
    }
  }

  return mergedData;
}

app.all("/pincode/:id?", async (req, res) => {
  const { id } = req.params;
  const entity = "Pincodes";
  const capp = catalyst.initialize(req);
  const zcql = capp.zcql();
  const table = capp.datastore().table(entity); // Assumes entity matches the table name

  try {
    switch (req.method) {
      case "GET":
        if (id) {
          // Fetch a specific record by ID
          const query = `SELECT * FROM ${entity} WHERE pincode = '${id}'`;
          const queryResp = await zcql.executeZCQLQuery(query);

          if (!queryResp || queryResp.length === 0) {
            return res.status(404).json({
              success: false,
              message: `${entity} with ID ${id} not found.`,
            });
          }
              const formattedData = queryResp.map(item => item[entity]);


          return res
            .status(200)
            .json({ success: true, data: formattedData});
        } else {
          const nextToken = req.query.token || null;

          // console.log("Fetching data with nextToken:", nextToken);

          try {
            // Fetch paginated data from the table
            const paginatedRows = await table.getPagedRows({
              nextToken: nextToken,
              maxRows: 100,
            });

            if (!paginatedRows.data || paginatedRows.data.length === 0) {
              return res.status(404).json({
                success: false,
                message: `No records found for ${entity}.`,
              });
            }

            // Send data and next token to the frontend
            return res.status(200).json({
              success: true,
              data: paginatedRows.data,
              pagination: {
                more_records: paginatedRows.more_records,
                next_token: paginatedRows.next_token,
              },
            });
          } catch (error) {
            console.error("Error fetching paginated data:", error.message);
            return res.status(500).json({
              success: false,
              message: "Error fetching paginated data.",
              // error: error.message,
            });
          }
        }

      case "POST":
        if (Array.isArray(req.body)) {
          // Bulk insert
          const rows = await table.insertRows(req.body);
          return res.status(201).json({
            success: true,
            message: `${entity} records created successfully.`,
            data: rows,
          });
        } else {
          // Single insert
          const row = await table.insertRow(req.body);
          return res.status(201).json({
            success: true,
            message: `${entity} record created successfully.`,
            data: row,
          });
        }

      case "PUT":
        if (!id) {
          return res.status(400).json({
            success: false,
            message: `ID is required for updating a ${entity} record.`,
          });
        }

        const updateData = req.body;
        updateData.ROWID = id;

        const updatedRow = await table.updateRow(updateData);
        return res.status(200).json({
          success: true,
          message: `${entity} record updated successfully.`,
          data: updatedRow,
        });

      case "DELETE":
        if (!id) {
          // Multi-delete support
          if (req.body && Array.isArray(req.body.rowIds)) {
            const rowIds = req.body.rowIds;
            const deleteResponse = await table.deleteRows(rowIds);

            return res.status(200).json({
              success: true,
              message: `${rowIds.length} ${entity} records deleted successfully.`,
              data: deleteResponse,
            });
          } else {
            return res.status(400).json({
              success: false,
              message: `ID or array of row IDs is required for deleting ${entity} record(s).`,
            });
          }
        } else {
          // Single delete by ID
          await table.deleteRow(id);
          return res.status(200).json({
            success: true,
            message: `${entity} record with ID ${id} deleted successfully.`,
          });
        }

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed for this route.`,
        });
    }
  } catch (error) {
    console.error("[/pincode] error:", error);
    return res.status(500).json({
      success: false,
      message: `Error processing request for ${entity}.`,
      // error: error.message,
    });
  }
});

// API route to retrieve all pages' metadata
app.get("/metadata/:pageId", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const pageId = req.params.pageId;

    // Fetch all pages metadata from Catalyst Datastore
    const zcql = capp.zcql();
    const query = `SELECT * FROM Pages WHERE ROWID = ${pageId}`;
    const queryResp = await zcql.executeZCQLQuery(query);

    // Check if any pages were found
    if (!queryResp || queryResp.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pages found." });
    }

    // Extract page details without wrapping in an additional object
    const pages = queryResp.map((record) => record.Pages);

    // Send the list of pages as a JSON response
    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("[/metadata/:pageId] error:", error);
    return res.status(500).json({ success: false, message: "Metadata not found" });
  }
});



app.all("/leads_live/:id?", async (req, res) => {
  const { id } = req.params;
  const entity = "Leads";
  const capp = catalyst.initialize(req);
  const zcql = capp.zcql();
  const table = capp.datastore().table(entity);
   const currUser = await capp.userManagement().getCurrentUser();
    // console.log("Current User:", currUser);

  try {
    switch (req.method) {
      case "GET":
        if (id) {
          // Fetch a specific lead by ID'
         
          const query = `SELECT * FROM ${entity} WHERE ROWID = '${id}'`;
          const queryResp = await zcql.executeZCQLQuery(query);

          if (!queryResp || queryResp.length === 0) {
            return res.status(404).json({
              success: false,
              message: `${entity} with ID ${id} not found.`,
            });
          }

          return res
            .status(200)
            .json({ success: true, data: queryResp[0][entity] });
        } else {
          const nextToken = req.query.token || null;
          try {
            // Fetch paginated data from the table
            const paginatedRows = await table.getPagedRows({
              nextToken: nextToken,
              maxRows: 100,
            });
            if (!paginatedRows.data || paginatedRows.data.length === 0) {
              return res.status(200).json({
                success: false,
                message: `No records found for ${entity}.`,
              });
            }

            // Send data and next token to the frontend
            return res.status(200).json({
              success: true,
              data: paginatedRows.data,
              pagination: {
                more_records: paginatedRows.more_records,
                next_token: paginatedRows.next_token,
              },
            });
          } catch (error) {
            console.error("Error fetching paginated data:", error.message);
            return res.status(500).json({
              success: false,
              message: "Error fetching paginated data.",
              // error: error.message,
            });
          }
        }
      case "POST":
        if (Array.isArray(req.body)) {
          // Bulk insert for leads
          const rows = await table.insertRows(req.body);
          return res.status(201).json({
            success: true,
            message: `${entity} records created successfully.`,
            data: rows,
          });
        } else {
          // Single insert for a lead
          const row = await table.insertRow(req.body);
          return res.status(201).json({
            success: true,
            message: `${entity} record created successfully.`,
            data: row,
          });
        }

      case "PUT":
        if (!id) {
          return res.status(400).json({
            success: false,
            message: `ID is required for updating a ${entity} record.`,
          });
        }

        const updateData = req.body;
        updateData.ROWID = id;

        const updatedRow = await table.updateRow(updateData);
        return res.status(200).json({
          success: true,
          message: `${entity} record updated successfully.`,
          data: updatedRow,
        });

      case "DELETE":
        if (!id) {
          // Check if body contains array of IDs for bulk delete
          if (req.body && Array.isArray(req.body.rowIds)) {
            const rowIds = req.body.rowIds;
            const rowPromise = table.deleteRows(rowIds);
            const deleteResult = await rowPromise;

            return res.status(200).json({
              success: true,
              message: `${rowIds.length} ${entity} records deleted successfully.`,
              data: deleteResult,
            });
          } else {
            return res.status(400).json({
              success: false,
              message: `ID or array of row IDs is required for deleting ${entity} record(s).`,
            });
          }
        } else {
          // Single delete by ID
          await table.deleteRow(id);
          return res.status(200).json({
            success: true,
            message: `${entity} record with ID ${id} deleted successfully.`,
          });
        }

      default:
        return res.status(405).json({
          success: false,
          message: `Method ${req.method} not allowed for this route.`,
        });
    }
  } catch (error) {
    console.error("[/leads_live] error:", error);
    return res.status(500).json({
      success: false,
      message: `Error processing request for ${entity}.`,
      // error: error.message,
    });
  }
});



// GET /api/verify-slug?slug=loan-demo
app.get("/verify-slug", async (req, res) => {
  try {
    const { slug } = req.query;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug parameter" });
    }
    const catalystApp = catalyst.initialize(req);
    const searchService = catalystApp.search();
    const config = {
      search: `${slug}`,
      search_table_columns: {
        Pages: ["pageSlug"], // adjust this to your actual table name & column
      },
    };
    const response = await searchService.executeSearchQuery(config);
    // Exact match check
    const hasExactMatch = Object.values(response).some(
      (records) =>
        Array.isArray(records) &&
        records.some((record) => record.pageSlug === slug)
    );
    res.json({ isUnique: !hasExactMatch });
  } catch (err) {
    console.error("Slug verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API route to retrieve all pages' metadata using slug
app.get("/metadata/slug/:slug", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const slug = req.params.slug;

    // Fetch all pages metadata from Catalyst Datastore
    const zcql = capp.zcql();
    const query = `SELECT * FROM Pages WHERE pageSlug = '${slug}'`;
    const queryResp = await zcql.executeZCQLQuery(query);
    // console.log("response",queryResp)

    // Check if any pages were found
    if (!queryResp || queryResp.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pages found." });
    }

    // Extract page details without wrapping in an additional object
    const pages = queryResp.map((record) => record.Pages);

    // Send the list of pages as a JSON response
    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("[/metadata/slug/:slug] error:", error);
    return res.status(500).json({ success: false, message: "Metadata of slug not found"});
  }
});

app.get("/dashboard-analytics", async (req, res) => {
  const catalystApp = catalyst.initialize(req);
  const zcql = catalystApp.zcql();

  try {
    // ZCQL queries
    const totalLeadsQuery = "SELECT COUNT(ROWID) FROM Leads";
    const unsyncedLeadsQuery =
      "SELECT COUNT(ROWID) FROM Leads WHERE CRMSync IS NULL";

    const totalPagesQuery = "SELECT COUNT(ROWID) FROM Pages";
    const draftedPagesQuery =
      "SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Draft'";
    const deletedPagesQuery =
      "SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Deleted'";
    const publishedQuery =
      "SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Published'";

    // Execute all queries in parallel
    const [
      totalLeads,
      unsyncedLeads,
      totalPages,
      draftedPages,
      deletedPages,
      publishedPages,
    ] = await Promise.all([
      zcql.executeZCQLQuery(totalLeadsQuery),
      zcql.executeZCQLQuery(unsyncedLeadsQuery),
      zcql.executeZCQLQuery(totalPagesQuery),
      zcql.executeZCQLQuery(draftedPagesQuery),
      zcql.executeZCQLQuery(deletedPagesQuery),
      zcql.executeZCQLQuery(publishedQuery),
    ]);

    // Cleaned-up response
    res.status(200).json({
      leads: {
        total: parseInt(totalLeads[0].Leads["COUNT(ROWID)"], 10),
        unsynced: parseInt(unsyncedLeads[0].Leads["COUNT(ROWID)"], 10),
      },
      pages: {
        total: parseInt(totalPages[0].Pages["COUNT(ROWID)"], 10),
        drafted: parseInt(draftedPages[0].Pages["COUNT(ROWID)"], 10),
        deleted: parseInt(deletedPages[0].Pages["COUNT(ROWID)"], 10),
        published: parseInt(publishedPages[0].Pages["COUNT(ROWID)"], 10),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// startus and media routes
app.post("/api/media", async (req, res) => {
  // const file = req.files.file;

  const file = req.files.file;


  if (!file) {
    return res.status(400).json({ msg: "No file uploaded" });
  }

  try {
    const capp = catalyst.initialize(req);
    const stratus = capp.stratus();
    const bucket = stratus.bucket(MEDIA_BUCKET);

    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_filename${safeObjectName(file.name, "media")}`;
    const uploadPath = "media/" + `${uniqueFileName}`;

    // In-memory Buffer - see the note in /save/page.
    const uploadRes = await bucket.putObject(uploadPath, file.data);
    if (!uploadRes) {
      throw new Error(`Stratus upload failed for ${uploadPath}`);
    }

    const objectIns = bucket.object(uploadPath);
    const objectRes = await objectIns.getDetails();
    console.log(
      `File ${uniqueFileName} uploaded to Catalyst Stratus.`,
      objectRes
    );

    const fileUrl = objectRes.object_url;
    const fileName = file.name;
    const table = capp.datastore().table("Media");
    const response = await table.insertRow({
      File_Name: fileName,
      File_Url: fileUrl,
    });

    res.status(200).json({
      msg: "Response Generated Successfully",
      data: response,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error uploading file", error: "Internal Server Error"});
  }
});

app.get("/api/media", async (req, res) => {
  const capp = catalyst.initialize(req);
  const table = capp.datastore().table("Media");
  const response = await table.getAllRows();
  
  res.status(200).json({
    msg: "Response Generated Successfully",
    data: response,
  });
});
app.delete("/api/media/:id", async (req, res) => {
  const id = req.params.id;
   
  if (!id) {
  return res.status(400).json({ msg: "No id provided" });
  }
   
  try {
  const capp = catalyst.initialize(req);
  const table = capp.datastore().table("Media");
  const response = await table.deleteRow(id);
  res.status(200).json({
  msg: "Response Generated Successfully",
  data: response,
  });
  } catch (err) {
  console.error(err);
  res.status(500).json({ msg: "Error deleting file", error: "Internal Server Error" });
  }
  });



  


//Increase the visit count and track the page

// /view-count PUT route using Zoho Catalyst
app.put("/view-count", async (req, res) => {
  try {
    console.log("Entered");

    const catalystApp = catalyst.initialize(req);
    const datastore = catalystApp.datastore();
    const pageTable = datastore.table("Pages");
    const zcql = catalystApp.zcql();

    const slug = req.query.slug;
    if (!slug) {
      return res.status(400).json({ error: "Missing slug parameter" });
    }

    const query = `SELECT View_Count, ROWID FROM Pages WHERE pageSlug = '${slug}'`;
    const results = await zcql.executeZCQLQuery(query);

    if (!results || results.length === 0 || !results[0].Pages) {
      return res.status(404).json({ message: "No Data Found" });
    }

    const pageRow = results[0].Pages;

    // Safely cast View_Count to number
    const currentCount = parseInt(pageRow.View_Count, 10);
    const safeCount = isNaN(currentCount) ? 0 : currentCount;

    const updatedData = {
      ROWID: pageRow.ROWID,
      View_Count: safeCount + 1,
    };

    const updatedRow = await pageTable.updateRow(updatedData);

    return res.status(200).json({
      success: true,
      message: "View count updated successfully.",
      data: updatedRow,
    });

  } catch (err) {
    console.error("Failed to update view count:", err);
    res.status(500).json({ error: "Server error" });
  }
});



app.get("/dashboard", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const zcql = capp.zcql();

    // Queries
    const leadsQuery = `SELECT COUNT(ROWID) FROM Leads`;
    const pagesQuery = `SELECT COUNT(ROWID) FROM Pages`;
    const publishedQuery = `SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Published'`;

    // Execute
    const queryResp = await zcql.executeZCQLQuery(leadsQuery);
    const pagesResp = await zcql.executeZCQLQuery(pagesQuery);
    const publishedPagesResp = await zcql.executeZCQLQuery(publishedQuery);

    // Extract values
    const totalLeads = parseInt(queryResp?.[0]?.Leads?.["COUNT(ROWID)"] || 0);
    const totalPages = parseInt(pagesResp?.[0]?.Pages?.["COUNT(ROWID)"] || 0);
    const PublishedPages = parseInt(publishedPagesResp?.[0]?.Pages?.["COUNT(ROWID)"] || 0);

    // Correct draft calculation
    const DraftPages = totalPages - PublishedPages;

const env = process.env.CATALYST_USER_ENVIRONMENT ;
console.log("Environment = ", env);

    res.status(200).json({
      success: true,
      data: {
        totalLeads,
        totalPages,
        PublishedPages,
        DraftPages
      },
      message: "Dashboard route is working!"
    });

  } catch (error) {
    console.error("Error in dashboard route:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
});


// --------------Abhay work starts from here------------------

app.get("/dashboard-card-analytics", async (req, res) => {
  const catalystApp = catalyst.initialize(req);
  const zcql = catalystApp.zcql();

  try {
    // ZCQL queries
    const totalLeadsQuery = "SELECT COUNT(ROWID) FROM Leads";
    // const unsyncedLeadsQuery =
    //   "SELECT COUNT(ROWID) FROM Leads WHERE CRMSync IS NULL";

    const totalPagesQuery = "SELECT COUNT(ROWID) FROM Pages";
    const draftedPagesQuery =
      "SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Draft'";
    // const deletedPagesQuery =
    //   "SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Deleted'";
    const publishedQuery =
      "SELECT COUNT(ROWID) FROM Pages WHERE Status = 'Published'";

    // Execute all queries in parallel
    const [
      totalLeads,
      totalPages,
      draftedPages,
      publishedPages,
    ] = await Promise.all([
      zcql.executeZCQLQuery(totalLeadsQuery),
      zcql.executeZCQLQuery(totalPagesQuery),
      zcql.executeZCQLQuery(draftedPagesQuery),
      zcql.executeZCQLQuery(publishedQuery),
    ]);

    // Cleaned-up response
    res.status(200).json({
      leads: {
        total: parseInt(totalLeads[0].Leads["COUNT(ROWID)"], 10),
        // unsynced: parseInt(unsyncedLeads[0].Leads["COUNT(ROWID)"], 10),
      },
      pages: {
        total: parseInt(totalPages[0].Pages["COUNT(ROWID)"], 10),
        drafted: parseInt(draftedPages[0].Pages["COUNT(ROWID)"], 10),
        // deleted: parseInt(deletedPages[0].Pages["COUNT(ROWID)"], 10),
        published: parseInt(publishedPages[0].Pages["COUNT(ROWID)"], 10),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.get("/month-wise-count", async (req, res) => {
  try {
    const catalystApp = catalyst.initialize(req);
    const zcql = catalystApp.zcql();
    const year = req.query.year || new Date().getFullYear();

    console.log("Year for month-wise count:", year);

const months = [
      { month: "Jan", start: `${year}-01-01 00:00:00`, end: `${year}-02-01 00:00:00` },
      { month: "Feb", start: `${year}-02-01 00:00:00`, end: `${year}-03-01 00:00:00` },
      { month: "Mar", start: `${year}-03-01 00:00:00`, end: `${year}-04-01 00:00:00` },
      { month: "Apr", start: `${year}-04-01 00:00:00`, end: `${year}-05-01 00:00:00` },
      { month: "May", start: `${year}-05-01 00:00:00`, end: `${year}-06-01 00:00:00` },
      { month: "Jun", start: `${year}-06-01 00:00:00`, end: `${year}-07-01 00:00:00` },
      { month: "Jul", start: `${year}-07-01 00:00:00`, end: `${year}-08-01 00:00:00` },
      { month: "Aug", start: `${year}-08-01 00:00:00`, end: `${year}-09-01 00:00:00` },
      { month: "Sep", start: `${year}-09-01 00:00:00`, end: `${year}-10-01 00:00:00` },
      { month: "Oct", start: `${year}-10-01 00:00:00`, end: `${year}-11-01 00:00:00` },
      { month: "Nov", start: `${year}-11-01 00:00:00`, end: `${year}-12-01 00:00:00` },
      { month: "Dec", start: `${year}-12-01 00:00:00`, end: `${Number(year) + 1}-01-01 00:00:00` }
    ];

    const data = [];

    for (const item of months) {
      const query = `
        SELECT COUNT(ROWID) AS total_count
        FROM Leads
        WHERE CREATEDTIME >= '${item.start}'
          AND CREATEDTIME < '${item.end}'
      `;

      const result = await zcql.executeZCQLQuery(query);
      console.log(`Result for ${item.month}:`, result);
      // const count =
      //   result?.[0]?.Leads?.total_count ||
      //   result?.[0]?.total_count ||
      //   0;
      const count = Number(result?.[0]?.Leads?.["COUNT(ROWID)"] || 0);

      data.push({
        month: item.month,
        count: Number(count)
      });
    }

    res.json({
      status: true,
      data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: false,
      message: "Internal Server Error"
    });
  }
});




app.get("/searchPages", async (req, res) => {
  try {
    const searchWord = req.query.pageName;

    if (!searchWord) {
      return res.status(400).json({
        success: false,
        message: "pageName is required"
      });
    }

    const capp = catalyst.initialize(req);

    const searchQuery = {
      search: searchWord,
      search_table_columns: {
        Pages: ["PageName"]
      }
    };

    const result = await capp
      .search()
      .executeSearchQuery(searchQuery);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("Search Error:", error);
    
    res.status(500).json({
      success: false,
      // error: error.message
      message:"Internal Server Error"
    });
  }
});




app.get("/all-pages", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const table = capp.datastore().table("Pages");
    // Get user management instance
    const userManagement = capp.userManagement();


    // Fetch all users
    const users = await userManagement.getAllUsers(ZOHO_ORG_ID);

    // Create a map of userId to full name for easy lookup
    const userMap = users.reduce((acc, user) => {
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      acc[user.user_id] = fullName;
      return acc;
    }, {});

    // Fetch all pages metadata from Catalyst Datastore
    const zcql = capp.zcql();

    const nextToken = req.query.token || null;

    const  paginatedRows = await table.getPagedRows({
      nextToken: nextToken,
      maxRows:  100,
    });

    // console.log("Paginated Rows:", paginatedRows.data);

    // const query = `SELECT * FROM Pages`;
    // const queryResp = await zcql.executeZCQLQuery(query);

    // Check if any pages were found
    if (!paginatedRows.data  || paginatedRows.data.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pages found." });
    }

    // Map through the results to extract page details and replace CREATORID with the user's name
      // Map pages
    const pages = paginatedRows.data.map((page) => {
      const creatorName = userMap[page.CREATORID] || "Admin";

      return {
        ...page,
        CreatedBy: creatorName,
      };
    });

    // Final response with pagination OUTSIDE map
    return res.status(200).json({
      success: true,
      data: pages,
      pagination: {
        more_records: paginatedRows.more_records,
        next_token: paginatedRows.next_token,
      },
    });


  } catch (error) {
    console.error("Internal Server Error :",error.message)
    return res.status(500).json({ success: false, message: "Internal Server error" });
  }
});



app.get("/mapped-pages", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const zcql = capp.zcql();
    console.log("Fetching mapped pages using ZCQL...");
const query = "SELECT * FROM Pages WHERE formMapping IS NOT NULL";
    const response = await zcql.executeZCQLQuery(query);
    // console.log("Raw ZCQL response:", response);
    return res.json({
      count: response.length,
      data: response
    });
  } catch (error) {
    console.error("Error fetching mapped pages:", error);
    return res.status(500).json({
      error: "Failed to fetch mapped pages",
      // details: error.message
    });
  }
});


app.get("/getLeadsByPageId", async (req, res) => {
  try {
    const { pageId } = req.query;
    if (!pageId) {
      return res.status(400).json({
        success: false,
        message: "pageId is required",
      });
    }
    let limit = parseInt(req.query.limit, 10) || 200;
    let offset = parseInt(req.query.offset, 10) || 0;
    const capp = catalyst.initialize(req);
    const zcql = capp.zcql();
    const query = `
      SELECT *
      FROM Leads
      WHERE pageId = '${pageId}'
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    const result = await zcql.executeZCQLQuery(query);
    return res.status(200).json({
      success: true,
       data :result,
      count: result.length,
      hasMore: result.length === limit,
     
    });
  } catch (error) {
    console.error("getLeadsByPageId error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});



// Object keys must not contain spaces or other characters that need escaping:
// putObject/getObject encodeURI the key while some APIs take it raw, so the two
// disagree and the object becomes unreadable. Collapse whitespace to "-" and
// drop anything outside a safe set, preserving the extension.
function safeObjectName(name, fallback = "page") {
  const cleaned = String(name || "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[.-]+/, "");
  return cleaned.length ? cleaned.slice(0, 150) : fallback;
}

function getFormattedTimestamp() {
  const now = new Date();

  const pad = (num, size = 2) => String(num).padStart(size, "0");

  return (
    now.getFullYear() + "-" +
    pad(now.getMonth() + 1) + "-" +
    pad(now.getDate()) + " " +
    pad(now.getHours()) + ":" +
    pad(now.getMinutes()) + ":" +
    pad(now.getSeconds()) + ":" +
    pad(now.getMilliseconds(), 3)
  );
}


app.post("/save/page", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const currUser = await capp.userManagement().getCurrentUser();

    console.log("Current :",currUser);

    if (!req.files || !req.files.files) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const file = req.files.files;

    const {
      status,
      name,
      stepformdata,
      slug,
      pageTitle,
    } = req.body;

    console.log("this is ",req.body);
    

    // Generate unique file name
const uniqueFileName = `${uuidv4()}_${safeObjectName(file.name, "page.html")}`;
    const uploadPath = `pages/${uniqueFileName}`;

    // Upload to Stratus. express-fileupload runs without useTempFiles, so
    // file.data is already an in-memory Buffer - upload that directly instead
    // of writing a temp file and streaming it back off disk.
    const stratus = capp.stratus();
    const bucket = stratus.bucket(STRATUS_BUCKET);

    const uploadRes = await bucket.putObject(uploadPath, file.data);

    // Log where the object landed. bucket_url carries the "-development"
    // suffix in the Development environment, so this is the URL to check.
    console.log("[save/page] uploaded:", uploadRes, {
      bucket: STRATUS_BUCKET,
      objectKey: uploadPath,
      objectUrl: `${bucket.bucketDetails.bucket_url}/${uploadPath}`,
    });

    // Never write the row unless the object really landed, otherwise Pages ends
    // up holding a FileID that resolves to nothing.
    if (!uploadRes) {
      throw new Error(`Stratus upload failed for ${uploadPath}`);
    }

    // Get uploaded object details
    // const uploadedObject = bucket.object(uploadPath);
    // const objectDetails = await uploadedObject.getDetails();
    // console.log("Uploaded object details:", objectDetails.object_key);

    // Save in Datastore
    const pagesTable = capp.datastore().table("Pages");

    const pageData = {
      Status: status,
      PageName: name ,
      stepformdata: stepformdata,
      pageTitle: pageTitle,
      pageSlug: slug,
      FileID: uploadPath, // Save the Stratus object key for retrieval
      modifiedTimeStamp: getFormattedTimestamp(),
      lastModifiedBy: currUser ? `${currUser.first_name} ${currUser.last_name}` : "Admin",

    };

    const pageRow = await pagesTable.insertRow(pageData);

    return res.status(200).json({
      success: true,
      message: "File uploaded and data saved",
      pageId: pageRow.ROWID,
      fileKey: uploadPath,
      // Storage location, echoed back so it is visible without reading logs.
      storage: {
        bucket: STRATUS_BUCKET,
        objectKey: uploadPath,
        objectUrl: `${bucket.bucketDetails.bucket_url}/${uploadPath}`,
        environment: process.env.CATALYST_USER_ENVIRONMENT || null,
      },
    });

  } catch (error) {
    console.error("Error in /save/pages:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


app.get("/page/:pageId", async (req, res) => {
  // console.log("Fetching page file for pageId:", req.params.pageId); 
  try {
    const capp = catalyst.initialize(req);
    const pagesTable = capp.datastore().table("Pages");
    const pageId = req.params.pageId;

    const row = await pagesTable.getRow(pageId);
    console.log("Page metadata row:", row);
    if (!row || !row.FileID) {
      return res.status(404).json({
        success: false,
        message: "FileID not found for this page",
      });
    }

    const objectKey = row.FileID;
    // console.log("Fetching file from Stratus with ObjectKey:", objectKey);

    const bucket = capp.stratus().bucket(STRATUS_BUCKET);
    const fileStream = await bucket.getObject(objectKey);

    res.setHeader("Content-Type", "text/html");
    fileStream.pipe(res);

  } catch (error) {
    console.error("Error fetching page file:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});



app.put("/update/page/:pageId", async (req, res) => {
  // console.log("Updating page file for pageId:", req.params.pageId);

  let tempFilePath = null;

  try {
    const userApp = catalyst.initialize(req);
    const adminApp = catalyst.initialize(req, { scope: "admin" });
    const currentUser = await userApp.userManagement().getCurrentUser();
    

    const pagesTable = adminApp.datastore().table("Pages");
    const bucket = adminApp.stratus().bucket(STRATUS_BUCKET);

    const pageId = req.params.pageId;
    const { status, pageName, stepformdata, formMapping } = req.body;

    // console.log("sending the name :", pageName);

    const row = await pagesTable.getRow(pageId);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Page not found",
      });
    }

    const oldObjectKey = row.FileID;
    let newObjectKey = oldObjectKey;

    if (req.files && req.files.files) {
      const file = req.files.files;
      // console.log("New file uploaded for update:", file.name);

      const uniqueFileName = `${uuidv4()}_${safeObjectName(file.name, "page.html")}`;

      // Store only object key/path in DB, not full URL
      const uploadPath = `pages/${uniqueFileName}`;

      // In-memory Buffer - see the note in /save/page.
      const uploadRes = await bucket.putObject(uploadPath, file.data);

      // console.log("Upload response:", uploadRes);

      if (!uploadRes) {
        throw new Error("File upload failed");
      }

      newObjectKey = uploadPath;
    }

    let updatedData = null;
    if (formMapping) {
      updatedData = {
        ROWID: pageId,
        FileID: newObjectKey,
        PageName: pageName || row.PageName,
        Status: status || row.Status,
        stepformdata: stepformdata || row.stepformdata,
        formMapping: formMapping,
      };
    }
    else{
      updatedData = {
      ROWID: pageId,
      FileID: newObjectKey,
      PageName: pageName || row.PageName,
      Status: status || row.Status,
      stepformdata: stepformdata || row.stepformdata,
      formMapping: formMapping,
      modifiedTimeStamp: getFormattedTimestamp(),
      lastModifiedBy: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "Admin",
      };

    }

    const updatedRow = await pagesTable.updateRow(updatedData);

    // Delete old file only after DB update succeeds
    if (
      req.files &&
      req.files.files &&
      oldObjectKey &&
      oldObjectKey !== newObjectKey
    ) {
      try {
        // oldObjectKey must be like "pages/file.html", not a full Stratus URL
        console.log("[update/page] deleting old object", {
          pageId,
          oldObjectKey,
          newObjectKey,
        });
        await bucket.deleteObject(oldObjectKey);
        console.log("Old object deleted:", oldObjectKey);
      } catch (deleteError) {
        console.error("Old file delete failed:", deleteError);

        // Do not fail the whole update because the new file and row update already succeeded
        return res.status(200).json({
          success: true,
          warning: true,
          message: "Page updated, but old Stratus file could not be deleted",
          // deleteError: deleteError.message || deleteError,
          pageId: updatedRow.ROWID,
          fileKey: newObjectKey,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Page updated successfully",
      pageId: updatedRow.ROWID,
      fileKey: newObjectKey,
    });
  } catch (error) {
    console.error("Error updating page file:", error);

    return res.status(500).json({
      success: false,
      message:  "Internal server error",
    });
  } finally {
    if (tempFilePath) {
      fs.unlink(tempFilePath, () => {});
    }
  }
});



app.delete("/delete/page/:pageId", async (req, res) => {
  try {
    const adminApp = catalyst.initialize(req, { scope: "admin" });
    const pageId = req.params.pageId;

    const pagesTable = adminApp.datastore().table("Pages");
    const row = await pagesTable.getRow(pageId);

    // Only the row has to exist. A row with no FileID, or one whose object was
    // never written, must still be deletable.
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Page not found for deletion.",
      });
    }

    const objectKey = row.FileID; // Stratus object key

    // Delete the page metadata from Catalyst Datastore
    await pagesTable.deleteRow(pageId);

    // Removing the Stratus object is best-effort. The row is the source of
    // truth and it is already gone, so an object that is missing or already
    // deleted must not turn a successful delete into a 500.
    let fileWarning = null;
    if (objectKey) {
      try {
        const bucket = adminApp.stratus().bucket(STRATUS_BUCKET);
        await bucket.deleteObject(objectKey);
      } catch (deleteError) {
        fileWarning = deleteError.message;
        console.warn(
          `[delete/page] row ${pageId} deleted, but Stratus object ${objectKey} could not be removed:`,
          deleteError.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      ...(fileWarning ? { warning: true, fileWarning } : {}),
      message: fileWarning
        ? "Page deleted. The associated file could not be removed."
        : "Page and associated file deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting page:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


app.post("/clone/page/:id", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const pageId = req.params.id;
    const { pageName, status, pageSlug, pageTitle } = req.body;

    if(!pageId) {
      return res.status(400).json({
        success: false,
        message: "Page ID is required for cloning."
      });
    }
    const zcql = capp.zcql();
    const query = `SELECT * FROM Pages WHERE ROWID = '${pageId}'`;
    const queryResp = await zcql.executeZCQLQuery(query);
    if (!queryResp || queryResp.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Page not found for cloning."
      });
    }

    const page = queryResp[0].Pages;
    const fileId = page.FileID;
    const originalPageName = page.PageName;
    const newPageName = pageName || `${originalPageName} clone`.slice(0, 255);
    const newStatus = status || page.Status;
    const newStepFormData = page.stepformdata;
    const newSlug = pageSlug;
    const newPageTitle = pageTitle ;

    


    console.log("Cloning page with details:", {
      pageId,
      fileId,
      newPageName,
      newStatus,
      newSlug,
      newPageTitle
    });

    const bucket = capp.stratus().bucket(STRATUS_BUCKET);
    const fileStream = await bucket.getObject(fileId);

    console.log("Fetched file stream for cloning:", fileStream);
    if(!fileStream) {
      return res.status(404).json({
        success: false,
        message: "Associated file not found for cloning."
      });
    }
    // Read the source object into memory, then upload it as a Buffer,
    // avoiding a temp-file round trip.
    const fileBuffer = await new Promise((resolve, reject) => {
      const chunks = [];
      fileStream.on("data", (chunk) => chunks.push(chunk));
      fileStream.on("end", () => resolve(Buffer.concat(chunks)));
      fileStream.on("error", reject);
    });

    const uniqueFileName = `${uuidv4()}_${safeObjectName(newPageName)}.html`;
    const uploadPath = `pages/${uniqueFileName}`;
    const uploadRes = await bucket.putObject(uploadPath, fileBuffer);

    if (!uploadRes) {
      throw new Error("File upload failed during cloning.");
    }
    const cloneObjectKey = uploadPath;

    const pagesTable = capp.datastore().table("Pages");
    const clonedPageData = {
   
      FileID: cloneObjectKey,
      Status: newStatus,
      PageName: newPageName,
      stepformdata: newStepFormData,
      pageSlug: newSlug,
      pageTitle: newPageTitle,
      isClone: true,
      modifiedTimeStamp: getFormattedTimestamp(),

    };

    const clonedPageRow = await pagesTable.insertRow(clonedPageData);

    if (!clonedPageRow || !clonedPageRow.ROWID) {
      throw new Error("Failed to save the cloned page metadata.");
    }

    return res.status(200).json({
      success: true,
      message: "Page cloned successfully.",
      pageId: clonedPageRow.ROWID,
      fileKey: cloneObjectKey,
    });
  } catch (error) {
    console.error("Error cloning page:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


app.get("/slug/:slug", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const slug = req.params.slug;

    // Fetch page metadata from Catalyst Datastore
    const zcql = capp.zcql();
    const query = `SELECT * FROM Pages WHERE pageSlug = '${slug}'`;
    const queryResp = await zcql.executeZCQLQuery(query);

    if (!queryResp || queryResp.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Page not found." });
    }

    const page = queryResp[0].Pages;
    const fileId = page.FileID;
    const pageName = page.PageName;

    // console.log("Fetching page with slug:", slug, "and fileId:", fileId);

    // Fetch the file from Stratus using the object key
    const bucket = capp.stratus().bucket(STRATUS_BUCKET);
    const fileStream = await bucket.getObject(fileId);

    if (!fileStream) {
      return res
        .status(404)
        .json({ success: false, message: "File not found." });
    }

    // Respond with the HTML file content
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Content-Disposition": `attachment; filename="page_${pageName}.html"`,
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("[/slug/:slug] error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});




async function processZipToCSV(downloadUrl, req, jobId) {
  const token = await getZohoAccessToken(req);

  const baseDir = path.join(os.tmpdir(), "migration_temp", String(jobId));
  const zipPath = path.join(baseDir, "file.zip");
  const extractPath = path.join(baseDir, "unzipped");

  await fs.promises.mkdir(baseDir, { recursive: true });
  await fs.promises.mkdir(extractPath, { recursive: true });

  // Download ZIP
  const response = await axios.get(downloadUrl, {
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
    },
    responseType: "stream",
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  // Extract ZIP
  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: extractPath }))
    .promise();

  // Find CSV
  const files = await fs.promises.readdir(extractPath);
  const csvFile = files.find((f) => f.toLowerCase().endsWith(".csv"));

  if (!csvFile) {
    throw new Error("No CSV file found inside ZIP");
  }

  const csvPath = path.join(extractPath, csvFile);
  const data = [];

  // Parse CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        try {
          if (row["Lead_data"]) {
            const obj = JSON.parse(row["Lead_data"]);
            if (obj && typeof obj === "object" && !Array.isArray(obj)) {
              data.push(obj);
            }
          }
        } catch (e) {}
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (!data.length) {
    return {
      hasData: false,
      outputPath: null,
      totalRecords: 0,
    };
  }

const firstLandingPageName =
  data[0]["Landing_Page_Name"] ||
  data[0]["Landing Page Name"] ||
  data[0]["landing_page_name"] ||
  "Landing_Page_Name";

const safeLandingPageName = String(firstLandingPageName)
  .replace(/[\\/:*?"<>|]/g, "-")
  .trim();

const outputFileName = `${safeLandingPageName} Leads.csv`;

outputPath = path.join(baseDir, outputFileName);

// console.log("firstLandingPageName:", firstLandingPageName);
// console.log("outputFileName:", outputFileName);

  // Collect all keys
  const allKeys = [];
  data.forEach((lead) => {
    Object.keys(lead).forEach((key) => {
      if (!allKeys.includes(key)) {
        allKeys.push(key);
      }
    });
  });

  const headers = allKeys.map((key) => ({
    id: key,
    title: key,
  }));

  // Normalize data
  const normalizedData = data.map((lead) => {
    const row = {};
    allKeys.forEach((key) => {
      const value = lead[key];
      if (value === undefined || value === null) {
        row[key] = "";
      } else if (typeof value === "object") {
        row[key] = JSON.stringify(value);
      } else {
        row[key] = value;
      }
    });
    return row;
  });

  const writer = createObjectCsvWriter({
    path: outputPath,
    header: headers,
  });

  await writer.writeRecords(normalizedData);

  return {
    hasData: true,
    outputPath,
    outputFileName,
    totalRecords: normalizedData.length,
  };
}


app.post("/createJob", async (req, res) => {
  try {
    const { pageId } = req.body;
    const capp = catalyst.initialize(req);
    const bulkRead = capp.datastore().table("Leads").bulkJob("read");

     const job = await bulkRead.createJob({
      criteria: {
        group_operator: "and",
        group: [
          {
            column_name: "pageId",
            comparator: "equal",
            value: pageId,
          },
        ],
      },
      select_columns: ["Lead_data"], // only required field
    });

    res.status(200).json({
      success: true,
      jobId: job.job_id,
      status: job.status, // In-Progress
    });
  } catch (error) {
    console.error("bulk read error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});


app.get("/getJobStatus", async (req, res) => {
  try {
    const { jobId } = req.query;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "jobId is required",
      });
    }

    const capp = catalyst.initialize(req);
    const bulkRead = capp.datastore().table("Leads").bulkJob("read");

    const statusResp = await bulkRead.getStatus(jobId);
    const data = statusResp?.data || statusResp;

    // Job still running / pending
    if (data.status !== "Completed") {
      return res.status(200).json({
        success: true,
        jobId,
        status: data.status,
        hasData: null,
        message: "Job still in progress",
      });
    }

    // Completed but no download URL
    const downloadUrl = data.results?.download_url;
    if (!downloadUrl) {
      return res.status(500).json({
        success: false,
        jobId,
        status: data.status,
        message: "Download URL not found",
      });
    }

    // Convert ZIP export to final CSV
    const result = await processZipToCSV(downloadUrl, req, jobId);

    // Completed successfully but no records found
    if (!result.hasData) {
      return res.status(200).json({
        success: true,
        jobId,
        status: data.status,
        hasData: false,
        totalRecords: 0,
        message: "No data found",
      });
    }

    // Validate output file exists
    await fs.promises.access(result.outputPath).catch(() => {
      throw new Error(`CSV file not found at path: ${result.outputPath}`);
    });

    // Download final parsed CSV
// Download final parsed CSV
const fileName = result.outputFileName || path.basename(result.outputPath);

return res.download(result.outputPath, fileName, (err) => {
  if (err) {
    console.error("File download error:", err);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to send parsed CSV",
      });
    }
  }
});
  } catch (error) {
    console.error("Get job status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job status",
    });
  }
});

module.exports = app;


