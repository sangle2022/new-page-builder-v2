const axios = require("axios");
const catalyst = require("zcatalyst-sdk-node");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const csvWriter = require("csv-writer").createObjectCsvWriter;
const fs = require("fs");
const path = require("path");

const unzipper = require("unzipper");
const csv = require("csv-parser");
const { createObjectCsvWriter } = require("csv-writer");
const os = require("os");

// Catalyst Stratus bucket holding page HTML files.
// Override with the STRATUS_BUCKET function env variable if the bucket is renamed.
const STRATUS_BUCKET = process.env.STRATUS_BUCKET || "fi-digital-pages";

const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
// Middleware setup for JSON body parsing and file upload
app.use(express.json());


app.use(
  cors({
	origin: "*", // Allows all origins, this is the default setting.
	methods: ["GET", "POST"], // Specify allowed methods
	allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
  })
);




app.get("/test", (req, res) => {
	const env = process.env.CATALYST_USER_ENVIRONMENT ||  "Development";
     console.log("Environment = ", env);
  res.send("Hello World!");
});


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
    console.error("Error in the getting Slug data:",error.message)
    return res.status(500).json({ success: false, message: "Error in the getting Slug data " });
  }
});


// API route to retrieve a page's metadata by ROWID.
// PageViewer falls back to this when the URL segment is a numeric page id
// instead of a slug, so the public viewer needs it alongside /metadata/slug/:slug.
app.get("/metadata/:pageId", async (req, res) => {
  try {
    const capp = catalyst.initialize(req);
    const pageId = req.params.pageId;

    const zcql = capp.zcql();
    const query = `SELECT * FROM Pages WHERE ROWID = ${pageId}`;
    const queryResp = await zcql.executeZCQLQuery(query);

    if (!queryResp || queryResp.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No pages found." });
    }

    const pages = queryResp.map((record) => record.Pages);

    return res.status(200).json({
      success: true,
      data: pages,
    });
  } catch (error) {
    console.error("Error in the getting metadata:", error.message);
    return res.status(500).json({ success: false, message: "Metadata not found" });
  }
});


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

app.put("/view-count", async (req, res) => {
  try {
    // console.log("Entered");

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


app.all(["/pincode", "/pincode/:id"], async (req, res) => {
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
    return res.status(500).json({
      success: false,
      message: `Error processing request for ${entity}.`,
      // error: error.message,
    });
  }
});



app.get("/page/:pageId", async (req, res) => {
  console.log("Fetching page file for pageId:", req.params.pageId); 
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
    console.log("Fetching file from Stratus with ObjectKey:", objectKey);

    const bucket = capp.stratus().bucket(STRATUS_BUCKET);
    const fileStream = await bucket.getObject(objectKey);

    console.log("files abhaye",fileStream);

    res.setHeader("Content-Type", "text/html");
    fileStream.pipe(res);

    console.log("testing")

  } catch (error) {
    console.error("Error fetching page file:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


module.exports = app;