const express = require("express");
const router = express.Router();
const {
  verifyAadhaar,
  verifyDrivingLicense,
  connectDigiLocker,
  getVerificationStatus,
} = require("../controllers/verificationController");
const auth = require("../middleware/auth");

router.get("/status", auth, getVerificationStatus);
router.post("/aadhaar", auth, verifyAadhaar);
router.post("/driving-license", auth, verifyDrivingLicense);
router.post("/digilocker", auth, connectDigiLocker);

module.exports = router;
