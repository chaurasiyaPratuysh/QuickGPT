import Chat from "../models/chat.js"


//Api Controller for creating a new chat
export const createChat = async (req, res)=> {
    try {
        const userId = req.user._id

        const chatData = {
            userId,
            messages: [],
            name: "New Chat",
            userName: req.user.name
        }
        await Chat.create(chatData)
        res.json({success: true, messages: "Chat created"})
    } catch (error) {
         res.json({success: false, message: error.message });
    }
}

//Api Controller for getting all chat
export const getChats = async (req, res)=> {
    try {
        const userId = req.user._id
        const chats = await Chat.find({userId}).sort({ updatedAt: -1 })

        res.json({success: true, chats})
    } catch (error) {
         res.json({success: false, message: error.message });
    }
}

//Api Controller for deleting a  chat
export const deleteChat = async (req, res)=> {
    try {
        const userId = req.user._id
       const {chatId} = req.body

       await Chat.deleteOne({_id: chatId, userId})

        res.json({success: true, message: "Chat Deleted"})
    } catch (error) {
         res.json({success: false, message: error.message });
    }
}


