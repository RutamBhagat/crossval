import { env } from "@crossval/env/server";
import mongoose from "mongoose";

await mongoose.connect(env.DATABASE_URL);

const connection = mongoose.connection;
const client = connection.getClient().db();

export { client, connection };
