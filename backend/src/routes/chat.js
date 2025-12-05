const express = require("express");
const router = express.Router();
const {
  getChatHistory,
  sendMessage,
  getChat,
} = require("../controllers/chatController");
const auth = require("../middleware/auth");

router.get("/", auth, getChatHistory);
router.post("/message", auth, sendMessage);
router.get("/:id", auth, getChat);

module.exports = router;
