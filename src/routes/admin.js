const express = require("express");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const axios = require("axios");
const database = require("../database");
const adminAuth = require("../adminAuth");

const router = express.Router();

router.get("/admin/login", (req, res) => {
  if (req.session && req.session.adminId) {
    res.redirect("/admin/dashboard");
    return;
  }
  res.render("admin/login", {
    error: req.query.error || null,
  });
});

router.post("/admin/login", async (req, res) => {
  try {
    const username = req.body.username || "";
    const password = req.body.password || "";

    const admin = await database.getAdminByUsername(username);
    if (!admin || !admin.password_hash) {
      res.redirect("/admin/login?error=invalid");
      return;
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      res.redirect("/admin/login?error=invalid");
      return;
    }

    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;

    // Ensure session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        res.redirect("/admin/login?error=invalid");
        return;
      }
      res.redirect("/admin/dashboard");
    });
  } catch (error) {
    console.error("Login error:", error);
    res.redirect("/admin/login?error=invalid");
  }
});

router.get("/admin/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

router.get("/admin/dashboard", adminAuth.requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    const verifications = await database.getAllVerifications(limit, offset);
    const stats = await database.getVerificationStats();

    res.render("admin/dashboard", {
      verifications,
      stats,
      page,
      adminUsername: req.session.adminUsername,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Error loading dashboard");
  }
});

router.get(
  "/admin/verification/:id",
  adminAuth.requireAuth,
  async (req, res) => {
    const sessionId = req.params.id;
    const verification = await database.getVerificationBySessionId(sessionId);

    if (!verification) {
      res.status(404).render("admin/404");
      return;
    }

    let parsedPersonData = null;
    let parsedRequestData = null;
    let parsedResponseData = null;

    try {
      if (verification.person_data) {
        parsedPersonData = JSON.parse(verification.person_data);
      }
    } catch (e) {}

    try {
      if (verification.request_data) {
        parsedRequestData = JSON.parse(verification.request_data);
      }
    } catch (e) {}

    try {
      if (verification.response_data) {
        parsedResponseData = JSON.parse(verification.response_data);
      }
    } catch (e) {}

    res.render("admin/detail", {
      verification,
      personData: parsedPersonData,
      requestData: parsedRequestData,
      responseData: parsedResponseData,
      adminUsername: req.session.adminUsername,
    });
  }
);

// Generate human-readable PDF report for verification
router.get(
  "/admin/verification/:id/download",
  adminAuth.requireAuth,
  async (req, res) => {
    try {
      const sessionId = req.params.id;
      const verification = await database.getVerificationBySessionId(sessionId);

      if (!verification) {
        res.status(404).send("Verification not found");
        return;
      }

      let personData = null;
      let responseData = null;

      try {
        if (verification.person_data) {
          personData = JSON.parse(verification.person_data);
        }
      } catch (e) {}

      try {
        if (verification.response_data) {
          responseData = JSON.parse(verification.response_data);
        }
      } catch (e) {}

      // Extract person data from multiple possible structures
      // Could be at personData.person, responseData.data.person, or personData.data.person
      let person = null;
      let apiData = null;
      
      if (personData && personData.person) {
        person = personData.person;
        apiData = personData;
      } else if (personData && personData.data && personData.data.person) {
        person = personData.data.person;
        apiData = personData.data;
      } else if (responseData && responseData.data && responseData.data.person) {
        person = responseData.data.person;
        apiData = responseData.data;
      } else if (responseData && responseData.person) {
        person = responseData.person;
        apiData = responseData;
      }

      // Create PDF document
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4',
        info: {
          Title: `Verification Report - ${verification.name}`,
          Author: "M'Cube Plus Verification System",
          Subject: "Identity Verification Report"
        }
      });

      // Set response headers for PDF download
      const filename = `verification_report_${verification.name.replace(/[^a-zA-Z0-9]/g, "_")}_${verification.session_id.substring(0, 8)}.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      
      // Pipe the PDF to the response
      doc.pipe(res);

      // Colors
      const primaryColor = '#b47b18';
      const successColor = '#10b981';
      const errorColor = '#ef4444';
      const grayColor = '#6b7280';
      const darkColor = '#1f2937';

      // Helper function to add a section header
      const addSectionHeader = (text, icon = '') => {
        doc.moveDown(0.5);
        doc.fontSize(14).fillColor(primaryColor).font('Helvetica-Bold');
        doc.text(`${icon} ${text}`.trim(), { underline: false });
        doc.moveDown(0.3);
        doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke(primaryColor);
        doc.moveDown(0.5);
        doc.fillColor(darkColor).font('Helvetica');
      };

      // Helper function to add a field row (handles missing values gracefully)
      const addField = (label, value, indent = 0) => {
        // Trim and clean the value
        let cleanValue = value;
        if (typeof value === 'string') {
          cleanValue = value.trim();
        }
        if (cleanValue && cleanValue !== 'null' && cleanValue !== 'undefined' && cleanValue !== '') {
          doc.fontSize(10).fillColor(grayColor).font('Helvetica-Bold');
          doc.text(`${label}:`, 50 + indent, doc.y, { continued: true });
          doc.fillColor(darkColor).font('Helvetica');
          doc.text(`  ${cleanValue}`);
          doc.moveDown(0.3);
        }
      };

      // ===== HEADER =====
      doc.fontSize(22).fillColor(primaryColor).font('Helvetica-Bold');
      doc.text("Identity Verification Report", { align: 'center' });
      doc.moveDown(0.5);
      
      // Status badge
      const statusColor = verification.status === 'approved' ? successColor : errorColor;
      const statusText = verification.status === 'approved' ? 'APPROVED' : 'FAILED';
      doc.fontSize(16).fillColor(statusColor).font('Helvetica-Bold');
      doc.text(statusText, { align: 'center' });
      doc.moveDown(1);

      // Report metadata
      doc.fontSize(9).fillColor(grayColor).font('Helvetica');
      const generatedDate = new Date().toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      doc.text(`Report Generated: ${generatedDate}`, { align: 'center' });
      doc.text(`Session ID: ${verification.session_id}`, { align: 'center' });
      doc.moveDown(1);

      // ===== VERIFICATION SUMMARY =====
      addSectionHeader('Verification Summary');
      
      const createdDate = new Date(verification.created_at).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      
      addField('Status', statusText);
      addField('Verified', verification.verified || (apiData && apiData.verified) || 'N/A');
      addField('Verification Date', createdDate);
      addField('Response Code', verification.code || (responseData && responseData.code) || 'N/A');
      
      // Add transaction ID from multiple sources
      const transactionId = verification.transaction_guid || 
                           (apiData && apiData.transactionGuid) || 
                           (responseData && responseData.data && responseData.data.transactionGuid);
      if (transactionId) {
        addField('Transaction ID', transactionId);
      }

      // Add additional API response fields
      if (apiData) {
        addField('Short Reference', apiData.shortGuid);
        addField('Source', apiData.source);
        addField('Center', apiData.center);
        if (apiData.requestTimestamp) {
          const reqDate = new Date(apiData.requestTimestamp).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          addField('Request Time', reqDate);
        }
        if (apiData.responseTimestamp) {
          const resDate = new Date(apiData.responseTimestamp).toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          });
          addField('Response Time', resDate);
        }
      }

      // ===== USER INFORMATION =====
      addSectionHeader('User Information');
      addField('Full Name', verification.name || (apiData && apiData.userID));
      addField('Email Address', verification.email);
      addField('Ghana Card PIN', verification.pin_number || (person && person.nationalId));

      // ===== ERROR DETAILS (if failed) =====
      if (verification.status === 'failed' && responseData && (responseData.message || responseData.msg)) {
        addSectionHeader('Error Details');
        doc.fontSize(10).fillColor(errorColor).font('Helvetica');
        doc.text(`Reason: ${responseData.message || responseData.msg || 'Verification failed'}`);
        doc.fillColor(darkColor);
      }

      // ===== GHANA CARD INFORMATION (if person data available) =====
      if (person) {
        
        addSectionHeader('Ghana Card Information');
        
        // Personal Details subsection
        doc.fontSize(11).fillColor(primaryColor).font('Helvetica-Bold');
        doc.text('Personal Details');
        doc.moveDown(0.3);
        
        addField('National ID', person.nationalId);
        addField('Card ID', person.cardId);
        addField('Surname', person.surname);
        addField('Forenames', person.forenames);
        addField('Date of Birth', person.birthDate);
        addField('Gender', person.gender);
        addField('Nationality', person.nationality);
        addField('Card Valid From', person.cardValidFrom);
        addField('Card Valid To', person.cardValidTo);

        // Addresses
        if (person.addresses && person.addresses.length > 0) {
          doc.moveDown(0.5);
          doc.fontSize(11).fillColor(primaryColor).font('Helvetica-Bold');
          doc.text('Address Information');
          doc.moveDown(0.5);
          
          person.addresses.forEach((address, index) => {
            const addressType = address.type || `Address ${index + 1}`;
            doc.fontSize(10).fillColor(grayColor).font('Helvetica-Bold');
            doc.text(`${addressType}:`, { underline: true });
            doc.moveDown(0.2);
            
            addField('Street', address.street, 20);
            addField('Town', address.town, 20);
            addField('Community', address.community, 20);
            addField('District', address.districtName, 20);
            addField('Region', address.region, 20);
            addField('Country', address.countryName, 20);
            addField('Postal Code', address.postalCode, 20);
            addField('Digital Address', address.addressDigital, 20);
            
            if (address.gpsAddressDetails && address.gpsAddressDetails.gpsName) {
              addField('GPS Address', address.gpsAddressDetails.gpsName, 20);
            }
            doc.moveDown(0.3);
          });
        }
      }

      // ===== SELFIE IMAGE =====
      if (verification.cloudinary_url) {
        // Check if we need a new page
        if (doc.y > 500) {
          doc.addPage();
        }
        
        addSectionHeader('Selfie Verification Image');
        
        try {
          // Fetch the image from Cloudinary
          const imageResponse = await axios.get(verification.cloudinary_url, {
            responseType: 'arraybuffer',
            timeout: 10000
          });
          
          const imageBuffer = Buffer.from(imageResponse.data);
          
          // Center the image
          const imageWidth = 200;
          const x = (doc.page.width - imageWidth) / 2;
          
          doc.image(imageBuffer, x, doc.y, { 
            width: imageWidth,
            align: 'center'
          });
          doc.moveDown(1);
          
          // doc.fontSize(9).fillColor(grayColor).font('Helvetica-Oblique');
          // doc.text('This selfie was captured during the verification process.', { align: 'center' });
        } catch (imageError) {
          console.error('Error fetching selfie image:', imageError.message);
          doc.fontSize(10).fillColor(grayColor);
          doc.text('Selfie image could not be loaded.', { align: 'center' });
          doc.text(`Image URL: ${verification.cloudinary_url}`, { align: 'center' });
        }
      }

      // ===== FOOTER =====
      // doc.moveDown(2);
      // doc.fontSize(8).fillColor(grayColor).font('Helvetica');
      // doc.text('─'.repeat(80), { align: 'center' });
      // doc.moveDown(0.3);
      // doc.text("This report was generated by M'Cube Plus Verification System", { align: 'center' });
      // doc.text('For questions or concerns, please contact the system administrator.', { align: 'center' });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("Download error:", error);
      res.status(500).send("Error generating report");
    }
  }
);

router.get("/admin/search", adminAuth.requireAuth, async (req, res) => {
  const query = req.query.q || "";
  const verifications = query ? await database.searchVerifications(query) : [];
  const stats = await database.getVerificationStats();

  res.render("admin/dashboard", {
    verifications,
    stats,
    page: 1,
    searchQuery: query,
    adminUsername: req.session.adminUsername,
  });
});

module.exports = router;
