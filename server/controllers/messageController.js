import axios from "axios"
import Chat from "../models/chat.js"
import User from "../models/user.js"
import openai from "../configs/openai.js"
import imageKit from "../configs/imageKit.js"


// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
    try {
        const userId = req.user._id

        // Check credits
        if (Number(req.user.credits) < 1) {
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }

        const {chatId, prompt} = req.body

        const chat = await Chat.findOne({userId, _id: chatId})
        if (!chat) {
            return res.json({success: false, message: "Chat not found"})
        }
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})

        const {choices} = await openai.chat.completions.create({
            model: "gemini-3.6-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const reply = {...choices[0].message, timestamp: Date.now(), isImage: false}
        chat.messages.push(reply)
        await chat.save()

        const user = await User.findById(userId)
        if (!user) {
            return res.json({success: false, message: "User not found"})
        }
        user.credits = Math.max(0, (Number(user.credits) || 0) - 1)
        await user.save()

        res.json({success: true, reply, credits: user.credits})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

//Images Generation Message Controller
export const imageMessageController = async (req, res)=>{
    try {
        const userId = req.user._id;
        // Check credits
        if (Number(req.user.credits) < 2) {
            return res.json({success: false, message: "You don't have enough credits to use this feature"})
        }
        const {prompt, chatId, isPublished, ispublished} = req.body
        // find chat
        const chat = await Chat.findOne({userId, _id: chatId})
        if (!chat) {
            return res.json({
                success: false,
                message: "Chat not found"
            })
        }
        
        //Push user message
        chat.messages.push({
            role: "user",
            content: prompt,
            timestamp: Date.now(),
            isImage: false
        });

        // Encode the prompt
        const encodedPrompt = encodeURIComponent(prompt)

        // Construct Imagekit AI generation URL
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,h-800`;
           
        // Trigger Generation by fetching from Imagekit
        const aiImageResponse = await axios.get( generatedImageUrl, {responseType: "arraybuffer"})

        // const to base64
        const base64Image = `data:image/png;base64, ${Buffer.from(aiImageResponse.data,"binary").toString('base64')}`;

        //upload to imagekit Library
        const uploadResponse = await imageKit.files.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        });
        const reply = {
            role: 'assistant',
            content: uploadResponse.url,
            timestamp: Date.now(),
            isImage: true,
            isPublished: isPublished ?? ispublished
        }

        chat.messages.push(reply)
        await chat.save()

        const user = await User.findById(userId)
        if (!user) {
            return res.json({success: false, message: "User not found"})
        }
        user.credits = Math.max(0, (Number(user.credits) || 0) - 2)
        await user.save()

        return res.json({success: true, reply, credits: user.credits})

    } catch (error) {
        res.json({success: false, message: error.message})
    }
}