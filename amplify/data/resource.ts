import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // User Profile - extends Cognito user with additional profile data
  UserProfile: a
    .model({
      id: a.id().required(),
      username: a.string().required(),
      email: a.string().required(),
      displayName: a.string(),
      bio: a.string(),
      avatarUrl: a.string(),
      joinedAt: a.datetime().required(),
      isActive: a.boolean().default(true),

      // Relationships
      locations: a.hasMany("UserLocation", "userId"),
      posts: a.hasMany("Post", "authorId"),
      comments: a.hasMany("Comment", "authorId"),
      votes: a.hasMany("Vote", "userId"),
      channelMemberships: a.hasMany("ChannelMembership", "userId"),
      feedItems: a.hasMany("FeedItem", "userId"),
      notifications: a.hasMany("Notification", "userId"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.publicApiKey().to(["read"]), // Allow unauthenticated users to view public profile info
    ]),

  // Location - Cities or metropolitan areas
  Location: a
    .model({
      id: a.id().required(),
      name: a.string().required(), // "Ann Arbor", "Chicago"
      slug: a.string().required(), // "ann-arbor", "chicago" - for URLs
      description: a.string(),
      state: a.string(), // "Michigan", "Illinois"
      country: a.string().default("United States"),
      latitude: a.float(),
      longitude: a.float(),
      timezone: a.string(),
      isActive: a.boolean().default(true),
      createdAt: a.datetime().required(),

      // Relationships
      channels: a.hasMany("Channel", "locationId"),
      userLocations: a.hasMany("UserLocation", "locationId"),
      posts: a.hasMany("Post", "locationId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]), // Allow unauthenticated users to view locations
      allow.group("admins").to(["create", "update", "delete"]),
      allow.owner(),
    ]),

  // User-Location relationship (many-to-many)
  UserLocation: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      locationId: a.id().required(),
      joinedAt: a.datetime().required(),
      isPrimary: a.boolean().default(false), // User's primary location

      // Relationships
      user: a.belongsTo("UserProfile", "userId"),
      location: a.belongsTo("Location", "locationId"),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.authenticated().to(["read"]),
    ]),

  // Channel - Topic-specific areas within locations
  Channel: a
    .model({
      id: a.id().required(),
      locationId: a.id().required(),
      name: a.string().required(), // "politics", "golf", "restaurants"
      slug: a.string().required(), // "politics", "golf", "restaurants" - for URLs
      description: a.string(),
      rules: a.string(), // Channel-specific rules in markdown
      color: a.string(), // Hex color for channel theming
      icon: a.string(), // Icon identifier
      isActive: a.boolean().default(true),
      isPrivate: a.boolean().default(false),
      createdAt: a.datetime().required(),
      createdBy: a.id().required(),

      // Stats
      memberCount: a.integer().default(0),
      postCount: a.integer().default(0),

      // Relationships
      location: a.belongsTo("Location", "locationId"),
      posts: a.hasMany("Post", "channelId"),
      memberships: a.hasMany("ChannelMembership", "channelId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]), // Allow unauthenticated users to view public channels
      allow.authenticated().to(["create"]),
      allow.ownerDefinedIn("createdBy").to(["update", "delete"]),
    ]),

  // Channel Membership - Track user subscriptions to channels
  ChannelMembership: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      channelId: a.id().required(),
      joinedAt: a.datetime().required(),
      role: a.enum(["member", "moderator", "admin"]),
      isNotificationsEnabled: a.boolean().default(true),

      // Relationships
      user: a.belongsTo("UserProfile", "userId"),
      channel: a.belongsTo("Channel", "channelId"),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.authenticated().to(["read"]),
      allow.publicApiKey().to(["read"]),
    ]),

  // Post - Main content entity
  Post: a
    .model({
      id: a.id().required(),
      locationId: a.id().required(),
      channelId: a.id().required(),
      authorId: a.id().required(),

      // Content
      title: a.string().required(),
      content: a.string(), // Markdown content for text posts
      type: a.enum(["text", "image", "link"]),

      // Link posts
      linkUrl: a.string(),
      linkTitle: a.string(),
      linkDescription: a.string(),
      linkImageUrl: a.string(),

      // Image posts
      imageUrls: a.string().array(), // S3 URLs for uploaded images
      imageAltTexts: a.string().array(), // Alt text for accessibility

      // Metadata
      isActive: a.boolean().default(true),
      isPinned: a.boolean().default(false),
      isLocked: a.boolean().default(false),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),

      // Engagement stats
      upvotes: a.integer().default(0),
      downvotes: a.integer().default(0),
      score: a.integer().default(0), // upvotes - downvotes
      commentCount: a.integer().default(0),

      // Relationships
      location: a.belongsTo("Location", "locationId"),
      channel: a.belongsTo("Channel", "channelId"),
      author: a.belongsTo("UserProfile", "authorId"),
      comments: a.hasMany("Comment", "postId"),
      votes: a.hasMany("Vote", "postId"),
      feedItems: a.hasMany("FeedItem", "postId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]), // Allow unauthenticated users to view posts
      allow.authenticated().to(["create"]),
      allow.ownerDefinedIn("authorId").to(["update", "delete"]),
    ]),

  // Comment - Nested comments on posts
  Comment: a
    .model({
      id: a.id().required(),
      postId: a.id().required(),
      authorId: a.id().required(),
      parentCommentId: a.id(), // For nested comments

      // Content
      content: a.string().required(), // Markdown content

      // Metadata
      isActive: a.boolean().default(true),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime().required(),

      // Engagement stats
      upvotes: a.integer().default(0),
      downvotes: a.integer().default(0),
      score: a.integer().default(0),

      // Relationships
      post: a.belongsTo("Post", "postId"),
      author: a.belongsTo("UserProfile", "authorId"),
      parentComment: a.belongsTo("Comment", "parentCommentId"),
      replies: a.hasMany("Comment", "parentCommentId"),
      votes: a.hasMany("Vote", "commentId"),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read"]), // Allow unauthenticated users to view comments
      allow.authenticated().to(["create"]),
      allow.ownerDefinedIn("authorId").to(["update", "delete"]),
    ]),

  // Vote - Upvotes/downvotes for posts and comments
  Vote: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      postId: a.id(),
      commentId: a.id(),
      type: a.enum(["upvote", "downvote"]),
      createdAt: a.datetime().required(),

      // Relationships
      user: a.belongsTo("UserProfile", "userId"),
      post: a.belongsTo("Post", "postId"),
      comment: a.belongsTo("Comment", "commentId"),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.authenticated().to(["read"]),
      allow.guest().to(["read"]),
    ]),

  // Feed Configuration - For personalized and algorithmic feeds
  FeedItem: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      postId: a.id().required(),
      feedType: a.enum(["all", "popular", "location", "channel"]),
      score: a.float().default(0), // Algorithm score for ranking
      createdAt: a.datetime().required(),

      // Relationships
      user: a.belongsTo("UserProfile", "userId"),
      post: a.belongsTo("Post", "postId"),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.guest().to(["read"]),
    ]),

  // Notification system
  Notification: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      type: a.enum([
        "post_comment",
        "comment_reply",
        "post_vote",
        "comment_vote",
        "channel_new_post",
        "location_new_channel",
      ]),
      title: a.string().required(),
      message: a.string().required(),
      isRead: a.boolean().default(false),
      createdAt: a.datetime().required(),

      // Related entity IDs for navigation
      postId: a.id(),
      commentId: a.id(),
      channelId: a.id(),
      locationId: a.id(),

      // Relationships
      user: a.belongsTo("UserProfile", "userId"),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn("userId"),
      allow.guest().to(["read"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
