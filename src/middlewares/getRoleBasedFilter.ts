import { User } from "../models/User";

// Utility: build shop filter based on role
export async function getRoleBasedFilter(user: any) {
    if (user.role === "global_manager") {
        return {}; // no restriction
    }

    if (user.role === "regional_manager") {
        // regional_manager → their own shops + shops created by field_agents
        const fieldAgents = await User.find({ role: "field_agent" }).select("_id");
        return {
            $or: [
                { specialist: user.userId },
                { specialist: { $in: fieldAgents.map((u) => u._id) } },
            ],
        };
    }

    if (user.role === "field_agent") {
        return { specialist: user.userId }; // only their own
    }

    return { _id: null }; // deny all for other roles
}
