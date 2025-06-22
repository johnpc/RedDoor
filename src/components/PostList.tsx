import { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import {
  View,
  Card,
  Text,
  Flex,
  Button,
  Loader,
  Alert,
  Badge,
  TextAreaField,
  Divider,
  Collection,
  Heading,
} from "@aws-amplify/ui-react";

import type { Schema } from "../../amplify/data/resource";
import { formatDate } from "../helpers";

const client = generateClient<Schema>();

interface Post {
  id: string;
  title: string;
  content?: string;
  type: "text" | "image" | "link";
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  imageUrls?: string[];
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
  };
  channel?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Comment {
  id: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
  };
}

interface PostListProps {
  locationId?: string;
  channelId?: string;
}

export default function PostList({ locationId, channelId }: PostListProps) {
  const { user } = useAuthenticator((context) => [context.user]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<{ [postId: string]: string }>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [locationId, channelId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);

      let filter: any = { isActive: { eq: true } };

      if (channelId) {
        filter.channelId = { eq: channelId };
      } else if (locationId) {
        filter.locationId = { eq: locationId };
      }

      const response = await client.models.Post.list({
        filter,
        authMode: "apiKey", // Allow unauthenticated access
      });

      if (response.data) {
        const postData = await Promise.all(
          response.data.map(async (post) => {
            // Fetch author info
            const authorResponse = await client.models.UserProfile.get(
              { id: post.authorId },
              { authMode: "apiKey" },
            );

            // Fetch channel info if not filtering by channel
            let channelInfo = undefined;
            if (!channelId && post.channelId) {
              const channelResponse = await client.models.Channel.get(
                { id: post.channelId },
                { authMode: "apiKey" },
              );
              if (channelResponse.data) {
                channelInfo = {
                  id: channelResponse.data.id,
                  name: channelResponse.data.name,
                  slug: channelResponse.data.slug,
                };
              }
            }
            const commentCount =
              (await post.comments({ authMode: "apiKey" })).data.length || 0;
            const author = await post.author({ authMode: "apiKey" });

            console.log({ post, authorResponse, author });
            return {
              id: post.id,
              title: post.title,
              content: post.content || undefined,
              type: post.type as "text" | "image" | "link",
              linkUrl: post.linkUrl || undefined,
              linkTitle: post.linkTitle || undefined,
              linkDescription: post.linkDescription || undefined,
              imageUrls:
                post.imageUrls?.filter((url): url is string => url !== null) ||
                undefined,
              upvotes: post.upvotes || 0,
              downvotes: post.downvotes || 0,
              score: post.score || 0,
              commentCount,
              createdAt: post.createdAt,
              author: {
                id: post.authorId,
                username: authorResponse.data?.username || "Unknown",
                displayName: authorResponse.data?.displayName || undefined,
              },
              channel: channelInfo,
            };
          }),
        );

        // Sort by score and creation date
        postData.sort((a, b) => {
          if (a.score !== b.score) {
            return b.score - a.score;
          }
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setPosts(postData);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await client.models.Comment.list({
        filter: {
          postId: { eq: postId },
          isActive: { eq: true },
        },
        authMode: "apiKey",
      });

      if (response.data) {
        const commentData = await Promise.all(
          response.data.map(async (comment) => {
            const authorResponse = await client.models.UserProfile.get(
              { id: comment.authorId },
              { authMode: "apiKey" },
            );

            return {
              id: comment.id,
              content: comment.content,
              upvotes: comment.upvotes || 0,
              downvotes: comment.downvotes || 0,
              score: comment.score || 0,
              createdAt: comment.createdAt,
              author: {
                id: comment.authorId,
                username: authorResponse.data?.username || "Unknown",
                displayName: authorResponse.data?.displayName || undefined,
              },
            };
          }),
        );

        // Sort by score and creation date
        commentData.sort((a, b) => {
          if (a.score !== b.score) {
            return b.score - a.score;
          }
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        setComments((prev) => ({ ...prev, [postId]: commentData }));
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const toggleComments = (postId: string) => {
    const newExpanded = new Set(expandedPosts);
    if (expandedPosts.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
    setExpandedPosts(newExpanded);
  };

  const handleCommentSubmit = async (postId: string) => {
    if (!user || !newComments[postId]?.trim()) return;

    try {
      await client.models.Comment.create({
        postId,
        authorId: user.userId,
        content: newComments[postId].trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Clear the comment input
      setNewComments((prev) => ({ ...prev, [postId]: "" }));

      // Refresh comments
      await fetchComments(postId);
    } catch (err) {
      console.error("Error creating comment:", err);
    }
  };

  if (loading) {
    return (
      <View padding="2rem" textAlign="center">
        <Loader size="large" />
        <Text marginTop="1rem">Loading posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <Alert variation="error" isDismissible onDismiss={() => setError(null)}>
        {error}
      </Alert>
    );
  }

  if (posts.length === 0) {
    return (
      <Card padding="2rem" textAlign="center">
        <Text color="font.secondary" fontSize="1.1rem">
          No posts yet. Be the first to share something!
        </Text>
      </Card>
    );
  }

  return (
    <Collection items={posts} type="list" direction="column" gap="1.5rem">
      {(post) => (
        <Card key={post.id} variation="outlined" padding="1.5rem">
          <Flex direction="column" gap="1rem">
            {/* Post Header */}
            <Flex direction="row" alignItems="center" gap="1rem" wrap="wrap">
              <Text fontSize="0.9rem" color="font.secondary">
                Posted by {post.author.displayName || post.author.username}
              </Text>
              {post.channel && (
                <Badge size="small" variation="info">
                  #{post.channel.name}
                </Badge>
              )}
              <Text fontSize="0.8rem" color="font.tertiary">
                {formatDate(post.createdAt)}
              </Text>
            </Flex>

            {/* Post Title */}
            <Heading level={3} color="brand.primary.80">
              {post.title}
            </Heading>

            {/* Post Content */}
            {post.type === "text" && post.content && (
              <View className="post-content">
                <Text>{post.content}</Text>
              </View>
            )}

            {post.type === "link" && (
              <Card variation="outlined" padding="1rem">
                <Flex direction="column" gap="0.5rem">
                  {post.linkTitle && (
                    <Text fontWeight="bold">{post.linkTitle}</Text>
                  )}
                  {post.linkDescription && (
                    <Text fontSize="0.9rem" color="font.secondary">
                      {post.linkDescription}
                    </Text>
                  )}
                  {post.linkUrl && (
                    <Button
                      as="a"
                      href={post.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variation="link"
                      size="small"
                    >
                      Visit Link →
                    </Button>
                  )}
                </Flex>
              </Card>
            )}

            {post.type === "image" && post.imageUrls && (
              <Flex direction="row" gap="0.5rem" wrap="wrap">
                {post.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Post image ${index + 1}`}
                    style={{
                      maxWidth: "300px",
                      maxHeight: "300px",
                      objectFit: "cover",
                    }}
                  />
                ))}
              </Flex>
            )}

            {/* Post Actions */}
            <Flex direction="row" alignItems="center" gap="1rem">
              <Badge
                size="small"
                variation={
                  post.score > 0 ? "success" : post.score < 0 ? "error" : "info"
                }
              >
                {post.score > 0 ? "+" : ""}
                {post.score} points
              </Badge>
              <Button
                variation="link"
                size="small"
                onClick={() => toggleComments(post.id)}
              >
                {post.commentCount} comments
              </Button>
            </Flex>

            {/* Comments Section */}
            {expandedPosts.has(post.id) && (
              <View>
                <Divider marginTop="1rem" marginBottom="1rem" />

                {/* Add Comment (only if logged in) */}
                {user && (
                  <Flex direction="column" gap="0.5rem" marginBottom="1rem">
                    <TextAreaField
                      label="Add a comment"
                      placeholder="Share your thoughts..."
                      value={newComments[post.id] || ""}
                      onChange={(e) =>
                        setNewComments((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      rows={3}
                    />
                    <Flex direction="row" justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={() => handleCommentSubmit(post.id)}
                        isDisabled={!newComments[post.id]?.trim()}
                      >
                        Post Comment
                      </Button>
                    </Flex>
                  </Flex>
                )}

                {!user && (
                  <Alert variation="info" marginBottom="1rem">
                    Sign in to add comments
                  </Alert>
                )}

                {/* Comments List */}
                {comments[post.id] && comments[post.id].length > 0 ? (
                  <Collection
                    items={comments[post.id]}
                    type="list"
                    direction="column"
                    gap="1rem"
                  >
                    {(comment) => (
                      <Card
                        key={comment.id}
                        variation="outlined"
                        padding="1rem"
                      >
                        <Flex direction="column" gap="0.5rem">
                          <Flex direction="row" alignItems="center" gap="1rem">
                            <Text fontSize="0.85rem" fontWeight="bold">
                              {comment.author.displayName ||
                                comment.author.username}
                            </Text>
                            <Text fontSize="0.75rem" color="font.tertiary">
                              {formatDate(comment.createdAt)}
                            </Text>
                            <Badge
                              size="small"
                              variation={
                                comment.score > 0
                                  ? "success"
                                  : comment.score < 0
                                    ? "error"
                                    : "info"
                              }
                            >
                              {comment.score > 0 ? "+" : ""}
                              {comment.score}
                            </Badge>
                          </Flex>
                          <Flex direction="row" alignItems="center" gap="1rem">
                            <View className="comment-content">
                              {/* <ReactMarkdown>{comment.content}</ReactMarkdown> */}
                              <Text fontSize="0.75rem" color="font.tertiary">
                                {comment.content}
                              </Text>
                            </View>
                          </Flex>
                        </Flex>
                      </Card>
                    )}
                  </Collection>
                ) : (
                  <Text color="font.secondary" fontSize="0.9rem">
                    No comments yet. Be the first to comment!
                  </Text>
                )}
              </View>
            )}
          </Flex>
        </Card>
      )}
    </Collection>
  );
}
