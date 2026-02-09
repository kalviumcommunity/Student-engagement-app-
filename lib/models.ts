import mongoose, { Schema } from "mongoose";

// User Schema
const UserSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['STUDENT', 'MENTOR'], default: 'STUDENT' },
}, { timestamps: true });

// Project Schema
const ProjectSchema = new Schema({
    title: { type: String, required: true },
    mentorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ProjectMember Schema
const ProjectMemberSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    joinedAt: { type: Date, default: Date.now },
});
ProjectMemberSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Task Schema
const TaskSchema = new Schema({
    title: { type: String, required: true },
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedToId: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// PeerFeedback Schema
const PeerFeedbackSchema = new Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// EngagementLog Schema
const EngagementLogSchema = new Schema({
    actionType: { type: String, required: true },
    details: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Models Initialization
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const ProjectMember = mongoose.models.ProjectMember || mongoose.model('ProjectMember', ProjectMemberSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const PeerFeedback = mongoose.models.PeerFeedback || mongoose.model('PeerFeedback', PeerFeedbackSchema);
export const EngagementLog = mongoose.models.EngagementLog || mongoose.model('EngagementLog', EngagementLogSchema);
