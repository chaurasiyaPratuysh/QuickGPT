import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        mongoose.connection.on("connected", () => {
            console.log("Database connected");
        });

        await mongoose.connect(`${process.env.MONGODB_URI}`);

        // Ensure all users have numeric credits
        await mongoose.connection.db.collection('users').updateMany(
            { credits: { $type: 'string' } },
            [
                {
                    $set: {
                        credits: {
                            $convert: {
                                input: '$credits',
                                to: 'double',
                                onError: 20,
                                onNull: 20
                            }
                        }
                    }
                }
            ]
        );
    } catch (error) {
        console.log("DB ERROR:", error.message);
    }
};

export default connectDB;