import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import userModel from "./src/model/User.js";
import eventModel from "./src/model/Event.js";
import connectDB from "./src/config/db.js"

const bot = new Telegraf(process.env.BOT_TOKEN)

try{

    connectDB();
    console.log("Database connected sucerfully");

}catch(err){

    console.error("Error while connecting to MongoDB", err);
    process.kill(process.pid, 'SIGTERM');

}

bot.start(async (ctx) => {

    const userForm = ctx.update.message.from;
    console.log("Form :", userForm);

    try{
        await userModel.findOneAndUpdate(
            { tgId: userForm.id },
            {
                $setOnInsert: {
                    firstName: userForm.first_name,
                    lastName: userForm.last_name,
                    isBot: userForm.is_bot,
                    userName: userForm.username,
                },
            },
            { upsert: true, new: true }
        );

        await ctx.reply(
            `Hi! ${userForm.first_name} 🎉 \n \n I'm here to help you create engaging and creative social media post descriptions in just a few seconds. \n \n This bot is created by "Narayan Mungase".`
        );

    }catch(err){
        console.error("Error while saving user data", err);
        ctx.reply("Oops! Something went wrong while saving your data. Please try again later.");
    }

});

bot.command("generate", async (ctx) => {
    const form = ctx.update.message.from;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    //get events for the user
    const events = await eventModel.find({
        tgId: form.id,
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
        },
    });

    console.log("Event", events);
    if (events.length === 0) {
        await ctx.reply("No Events for the day. Please try again");
        return;
    }
    
    //send post description to user
    //make openai api call
    //store token count
    //send response

    await ctx.reply("Doing Things...");
});

bot.on(message('text'), async (ctx)=>{

    const fromUser = ctx.update.message.from;
    const message = ctx.update.message.text;

    try{
        const event = new eventModel({
            text: message,
            tgId: fromUser.id,
        });

        await ctx.reply('Noted 👍, Keep texting me your thought. To generate the post description, just enter the command: /generate')

    }catch(err){
        console.error("Error while processing message", err);
        await ctx.reply("Oops! Something went wrong while processing your message. Please try again later.");
    }
});



bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));