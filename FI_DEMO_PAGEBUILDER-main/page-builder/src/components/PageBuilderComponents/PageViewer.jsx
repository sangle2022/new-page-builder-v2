/* global grecaptcha */

import React, {
  useEffect,
  useLayoutEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { PropagateLoader } from "react-spinners";
import PageUnderMaintenance from "./PageUnderMaintenance";
import PageNotFound from "./PageNotFound";
import DynamicForm from "./DynamicForm";
import CongratulationsMessage from "./CongratulationsMessage";
import axios from "axios";
import { useSelector } from "react-redux";

const PageViewer = () => {
  const { pageId, slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [showHoldOnMessage, setShowHoldOnMessage] = useState(false);
  const [pageStatus, setPageStatus] = useState(null);
  const [siteKeyLoaded, setSiteKeyLoaded] = useState(false);
  const [resolvedPageId, setResolvedPageId] = useState(null);
  const [pagename, setPagename] = useState("");
  const [pageHtml, setPageHtml] = useState(null);
  const [headHtml, setHeadHtml] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [formMetadata, setFormMetadata] = useState(null);
  const [externalScripts, setExternalScripts] = useState([]);
  const [externalStyles, setExternalStyles] = useState([]);
  const [linksReady, setLinksReady] = useState(false);
  const [tailwindReady, setTailwindReady] = useState(false);
  const stylesReady = linksReady && tailwindReady;

  const pageContainerRef = useRef(null);
  const [formPortalNode, setFormPortalNode] = useState(null);
  const [formParentNode, setFormParentNode] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [successPortalNode, setSuccessPortalNode] = useState(null);

  // const captureleadapi = "/server/page_builder_function/submit/form";
  const captureleadapi = "/server/migration/submit/form";
  const userDetails = useSelector((state) => state.user);

  // ─── First-open tracking (same as original) ───
  const isFirstOpen = useMemo(() => {
    const key = `pageOpened-${pageId}`;
    const pageOpened = localStorage.getItem(key);
    if (!pageOpened) {
      localStorage.setItem(key, "true");
      return true;
    }
    return false;
  }, [pageId]);

  // ─── View count (same as original) ───
  useEffect(() => {
    const updateClickCount = async () => {
      if (
        isFirstOpen &&
        (userDetails === null || Object.keys(userDetails).length === 0)
      ) {
        try {
          await axios.put(`/server/migration/view-count?slug=${pageId}`);
        } catch (error) {
          console.error("Error updating click count:", error);
        }
      }
    };
    updateClickCount();
  }, [isFirstOpen, pageId, userDetails]);

  // ─── UTM params from hash (same as original) ───
  const getUtmParamsFromHash = useCallback(() => {
    const hash = window.location.hash;
    const [, queryString] = hash.split("?");
    if (!queryString) return {};
    const params = new URLSearchParams(queryString);
    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
    };
  }, []);

  // ─── Map form data to JSON payload (same as original) ───
  const mapFormDataToJson = useCallback(
    (formData) => {
      const utmParams = getUtmParamsFromHash();
      const currentPageId =
        resolvedPageId || sessionStorage.getItem("Resolved_Page_Id") || pageId;
      const currentPageName =
        pagename || sessionStorage.getItem("PageName") || "null";

      const now = new Date();
      const formattedDateTime = now.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      return {
        ...formData,
        pageId: currentPageId,
        Landing_Page_Name: currentPageName,
        otpVerified: sessionStorage.getItem("JsonOTP"),
        [sessionStorage.getItem("loanproductname")]:
          sessionStorage.getItem("loanProduct"),
        ...utmParams,
        Date_And_Time: formattedDateTime,
      };
    },
    [resolvedPageId, pagename, pageId, getUtmParamsFromHash],
  );

  // ─── Load reCAPTCHA script (same as original) ───
  const loadRecaptchaScript = useCallback(() => {
    const existing = document.querySelector(
      'script[src="https://www.google.com/recaptcha/api.js"]',
    );
    if (existing) return;
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // ─── Fetch site key (same as original) ───
  const fetchSiteKey = useCallback(async () => {
    try {
      const response = await axios.get("/server/verification/manageCaptchaKey");
      if (response.data.success) {
        sessionStorage.setItem("site-key", response.data.siteKey);
      } else {
        // No captcha key configured yet. The route answers 200 with
        // { success: false }, so this is not an error - just carry on without
        // a site key rather than leaving the page stuck on the loader.
        console.log("No captcha site key configured.");
      }
    } catch (error) {
      console.log("Error Fetching Site Key = ", error);
    } finally {
      // Must always run: the page-content effect below is gated on this flag.
      setSiteKeyLoaded(true);
    }
  }, []);

  // ─── Meta Pixel (same as original) ───
  const injectMetaPixelBase = useCallback(() => {
    if (window.fbq || document.getElementById("meta-pixel-base")) return;
    const script = document.createElement("script");
    script.id = "meta-pixel-base";
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '1350310859923632');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }, []);

  const trackMetaLead = useCallback(() => {
    if (!window.fbq) injectMetaPixelBase();
    if (window.fbq) {
      window.fbq("track", "Lead");
    }
  }, [injectMetaPixelBase]);

  // ─── Initial setup (same as original) ───
  useEffect(() => {
    fetchSiteKey();
    sessionStorage.setItem("JsonOTP", false);
    loadRecaptchaScript();
  }, [fetchSiteKey, loadRecaptchaScript]);

  // ─── Fetch page content (same as original, minus document.write) ───
  useEffect(() => {
    if (!siteKeyLoaded) return;

    const fetchPageContent = async () => {
      try {
        if (!pageId && !slug) {
          console.error("Both pageId and slug are undefined.");
          setPageStatus("Deleted");
          setLoading(false);
          return;
        }

        const isValidPageId = pageId && /^\d{8,}$/.test(pageId);
        const identifier = pageId || slug;
        const isSlug = !isValidPageId;

        // const metadataURL = isSlug
        //   ? `/server/page_builder_function/metadata/slug/${identifier}`
        //   : `/server/page_builder_function/metadata/${identifier}`;

        const metadataURL = isSlug
          ? `/server/migration/metadata/slug/${identifier}`
          : `/server/migration/metadata/${identifier}`;

        let metadata;
        try {
          const metadataResponse = await axios.get(metadataURL);
          metadata = metadataResponse.data;
        } catch (err) {
          if (err.response?.status === 404) {
            setPageStatus("Deleted");
            setLoading(false);
            return;
          }
          throw new Error("Failed to fetch page metadata");
        }
        const status = metadata.data[0].Status.toUpperCase();
        const idPage = metadata.data[0].ROWID;
        const currentPageName = metadata.data[0].PageName || "";

        setResolvedPageId(idPage);
        setPagename(currentPageName);
        sessionStorage.setItem("Resolved_Page_Id", idPage);
        sessionStorage.setItem("PageName", currentPageName);

        if (metadata.success && status === "PUBLISHED") {
          const title = metadata.data[0].pageTitle;
          setPageTitle(title);
          setPagename(currentPageName);
          sessionStorage.setItem("Landing_Page_Name", currentPageName);

          let metaDataContent = metadata.data[0]?.stepformdata;
          let parsedFormMetadata = null;

          try {
            metaDataContent = JSON.parse(metaDataContent);
            if (Array.isArray(metaDataContent) && metaDataContent.length > 0) {
              parsedFormMetadata = metaDataContent;
            }
          } catch (error) {
            console.error("Failed to parse metadata content as JSON", error);
          }

          setFormMetadata(parsedFormMetadata);

          let pageContent;
          try {
            const contentResponse = await axios.get(
              `/server/migration/page/${idPage}`,
              { responseType: "text", transformResponse: [(data) => data] },
            );
            pageContent = contentResponse.data;
          } catch (err) {
            throw new Error("Failed to fetch page content");
          }
          const parser = new DOMParser();
          const doc = parser.parseFromString(pageContent, "text/html");

          // Collect all stylesheets: our additions + any from fetched page
          const allStyles = [`${window.location.origin}/css/bootstrap.min.css`];
          doc.head
            .querySelectorAll("link[rel='stylesheet']")
            .forEach((link) => {
              const href = link.getAttribute("href");
              if (href && !allStyles.includes(href)) {
                allStyles.push(href);
              }
            });
          setExternalStyles(allStyles);

          // Collect scripts to inject
          setExternalScripts([
            `${window.location.origin}/js/tailwind.js`,
            `${window.location.origin}/js/bootstrap.bundle.min.js`,
          ]);

          // Collect inline styles and meta from fetched page head
          let collectedHeadHtml = "";
          doc.head.querySelectorAll("style, meta").forEach((el) => {
            collectedHeadHtml += el.outerHTML;
          });
          setHeadHtml(collectedHeadHtml);

          // Replace .dynamic-form with a portal placeholder
          // Keep the original class so page CSS still targets it
          const dynamicFormDiv = doc.querySelector(".dynamic-form");
          if (dynamicFormDiv) {
            dynamicFormDiv.innerHTML = "";
            dynamicFormDiv.setAttribute("id", "dynamic-form-portal");
          }

          const bodyHtml = doc.body.innerHTML;
          setPageHtml(bodyHtml);
          injectMetaPixelBase();
          loadRecaptchaScript();
        } else if (status === "DRAFT") {
          setPageStatus("Draft");
        } else {
          setPageStatus("Deleted");
        }
      } catch (error) {
        console.warn("Error fetching page content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPageContent();

    const timer = setTimeout(() => {
      if (loading) {
        setShowHoldOnMessage(true);
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
    };
  }, [siteKeyLoaded, pageId, slug]);

  // ─── Set document title (replaces original's setTimeout title logic) ───
  useEffect(() => {
    if (pageTitle) {
      document.title = pageTitle;
    }
  }, [pageTitle]);

  // ─── Inject head content from fetched page into actual document.head ───
  // useLayoutEffect so inline <style> tags are applied BEFORE the browser paints the body
  useLayoutEffect(() => {
    if (!headHtml) return;
    const container = document.createElement("div");
    container.innerHTML = headHtml;
    const injectedElements = [];
    Array.from(container.children).forEach((el) => {
      const clone = el.cloneNode(true);
      document.head.appendChild(clone);
      injectedElements.push(clone);
    });
    return () => {
      injectedElements.forEach((el) => {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    };
  }, [headHtml]);

  // ─── Load external stylesheets and wait for them before showing page ───
  useEffect(() => {
    if (externalStyles.length === 0) return;

    const loadedLinks = [];
    let loadedCount = 0;
    const totalToLoad = externalStyles.filter(
      (href) => !document.querySelector(`link[href="${href}"]`),
    ).length;

    // If all stylesheets already exist in the document, mark ready immediately
    if (totalToLoad === 0) {
      setLinksReady(true);
      return;
    }

    const onLinkReady = () => {
      loadedCount += 1;
      if (loadedCount >= totalToLoad) {
        // One frame so the browser applies the just-loaded stylesheet
        // before we flip opacity from 0 → 1. Prevents FOUC without lag.
        requestAnimationFrame(() => setLinksReady(true));
      }
    };

    externalStyles.forEach((href) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.onload = onLinkReady;
        link.onerror = onLinkReady; // Don't block on failed stylesheets
        document.head.appendChild(link);
        loadedLinks.push(link);
      }
    });

    return () => {
      loadedLinks.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, [externalStyles]);

  // ─── Load external scripts ───
  // Tailwind (play CDN) is a runtime JIT that generates CSS AFTER it executes
  // against the current DOM. We must wait for it to finish before showing
  // the page, otherwise Tailwind utility classes render unstyled for a frame.
  useEffect(() => {
    if (externalScripts.length === 0) return;

    const tailwindSrc = externalScripts.find((s) => s.includes("tailwind"));
    const loadedScripts = [];

    // If tailwind is already present on the page, it has already processed;
    // mark ready immediately. Otherwise, wait for its load event + one paint
    // so the generated <style> tag is applied before we flip opacity.
    const existingTailwind =
      tailwindSrc && document.querySelector(`script[src="${tailwindSrc}"]`);
    if (!tailwindSrc || existingTailwind) {
      setTailwindReady(true);
    }

    externalScripts.forEach((src) => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        if (src === tailwindSrc) {
          script.onload = () => {
            // Two rAFs: first tick lets tailwind JIT scan the DOM & inject
            // its <style> tag, second tick lets the browser apply those rules.
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setTailwindReady(true));
            });
          };
          script.onerror = () => setTailwindReady(true);
        }
        document.body.appendChild(script);
        loadedScripts.push(script);
      }
    });

    return () => {
      loadedScripts.forEach((script) => {
        if (script.parentNode) script.parentNode.removeChild(script);
      });
    };
  }, [externalScripts]);

  // ─── Execute inline scripts from page HTML + set up portal node + burger menu ───
  useEffect(() => {
    if (!pageHtml || !pageContainerRef.current) return;

    const container = pageContainerRef.current;

    // Re-insert scripts so they execute (innerHTML doesn't execute scripts)
    const scripts = container.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    // Set up portal node for the dynamic form
    const portalNode = container.querySelector("#dynamic-form-portal");
    if (portalNode) {
      setFormPortalNode(portalNode);
    }

    const parentNode = container.querySelector(".form-parent, #form-parent");
    if (parentNode) {
      setFormParentNode(parentNode);
    }

    // Burger menu toggle (same as original window.script)
    const burgerIcon = container.querySelector(".burger-icon");
    const mobileMenu = container.querySelector(".mobile-menu");
    if (burgerIcon && mobileMenu) {
      burgerIcon.addEventListener("click", () => {
        mobileMenu.classList.toggle("hidden");
      });
    }
  }, [pageHtml]);

  useLayoutEffect(() => {
    if (!formSubmitted) return;

    const targetNode = formParentNode || formPortalNode;
    if (!targetNode) return;

    const successNode = document.createElement("div");
    targetNode.replaceChildren(successNode);
    setSuccessPortalNode(successNode);
  }, [formSubmitted, formParentNode, formPortalNode]);

  // ─── Loading state (same as original) ───
  if (loading) {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255, 255, 255, 0.8)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}
      >
        <PropagateLoader color="#3169be" size={15} />
        {showHoldOnMessage && (
          <p style={{ marginTop: "20px", fontSize: "16px", color: "#555" }}>
            Hold on, this might take a few more seconds... <br />
            <strong style={{ color: "#3169be" }}>Fristine Team</strong>
          </p>
        )}
      </div>
    );
  }

  if (pageStatus === "Draft") {
    return <PageUnderMaintenance />;
  }

  if (pageStatus === "Deleted") {
    return <PageNotFound />;
  }

  // ─── Render page HTML + portal for DynamicForm ───
  if (pageHtml) {
    return (
      <>
        {/* Keep loader visible until stylesheets are loaded AND applied.
            We do NOT mount the page <div> until stylesReady — mounting it with
            visibility:hidden still triggers a layout pass on unstyled content,
            which caused the visible "deflection" when styles finally applied. */}
        {!stylesReady && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "#ffffff",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <PropagateLoader color="#3169be" size={15} />
          </div>
        )}
        {/* Page container is ALWAYS mounted so refs & the portal-lookup
            effect can run immediately. While stylesheets load we hide the
            container off-screen (opacity 0 + absolute) so unstyled content
            never paints in the viewport — avoids the FOUC/deflection without
            blocking React effects. */}
        <div
          ref={pageContainerRef}
          style={
            stylesReady
              ? undefined
              : {
                  opacity: 0,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  pointerEvents: "none",
                }
          }
          dangerouslySetInnerHTML={{ __html: pageHtml }}
        />
        {!formSubmitted &&
          formPortalNode &&
          formMetadata &&
          createPortal(
            <DynamicForm
              formMetadata={formMetadata}
              captureleadapi={captureleadapi}
              mapFormDataToJson={mapFormDataToJson}
              trackMetaLead={trackMetaLead}
              loadRecaptchaScript={loadRecaptchaScript}
              onSubmitSuccess={() => setFormSubmitted(true)}
            />,
            formPortalNode,
          )}

        {formSubmitted &&
          successPortalNode &&
          createPortal(<CongratulationsMessage />, successPortalNode)}
      </>
    );
  }

  return null;
};

export default PageViewer;
