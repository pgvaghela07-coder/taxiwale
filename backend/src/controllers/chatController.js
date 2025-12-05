const Chat = require("../models/Chat");

// Simple rule-based chatbot responses
const getBotResponse = (message) => {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! 👋 Welcome to Tripeaz Taxi Partners. How can I help you today?";
  }

  if (lowerMessage.includes("booking") || lowerMessage.includes("post")) {
    return "To post a booking, go to the dashboard and click the + button, then select 'Upload New Booking'.";
  }

  if (lowerMessage.includes("vehicle") || lowerMessage.includes("car")) {
    return "To post a vehicle, go to the dashboard and click the + button, then select 'Upload Free Vehicle'.";
  }

  if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
    return "For support, you can contact us via WhatsApp, call, or email. Check the support menu for details.";
  }

  if (
    lowerMessage.includes("verification") ||
    lowerMessage.includes("verify")
  ) {
    return "To verify your identity, go to your profile and complete Aadhaar or Driving License verification.";
  }

  if (lowerMessage.includes("wallet") || lowerMessage.includes("payment")) {
    return "You can view your wallet balance and transactions in your profile section.";
  }

  // Default response
  return "I'm here to help! You can ask me about bookings, vehicles, verification, or support. How can I assist you?";
};

// @desc    Get chat history
// @route   GET /api/chat
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    let chat = await Chat.findOne({ userId: req.userId });

    if (!chat) {
      // Create new chat with welcome message
      chat = await Chat.create({
        userId: req.userId,
        messages: [
          {
            role: "bot",
            content:
              "Hello! 👋 Welcome to Tripeaz Taxi Partners. How can I help you today?",
            timestamp: new Date(),
          },
        ],
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Get Chat History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};

// @desc    Send message
// @route   POST /api/chat/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    let chat = await Chat.findOne({ userId: req.userId });

    if (!chat) {
      chat = await Chat.create({
        userId: req.userId,
        messages: [],
      });
    }

    // Add user message
    chat.messages.push({
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    });

    // Get bot response
    const botResponse = getBotResponse(message);

    // Add bot response
    chat.messages.push({
      role: "bot",
      content: botResponse,
      timestamp: new Date(),
    });

    await chat.save();

    res.json({
      success: true,
      message: "Message sent successfully",
      data: {
        userMessage: chat.messages[chat.messages.length - 2],
        botResponse: chat.messages[chat.messages.length - 1],
      },
    });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// @desc    Get specific chat
// @route   GET /api/chat/:id
// @access  Private
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check if user owns the chat
    if (chat.userId.toString() !== req.userId && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this chat",
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Get Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch chat",
    });
  }
};
