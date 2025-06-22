import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { withAuthenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import {
  View,
  Heading,
  Card,
  Button,
  TextField,
  TextAreaField,
  SelectField,
  Flex,
  Alert,
  Loader,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from "@aws-amplify/ui-react";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

interface LocationData {
  id: string;
  name: string;
  slug: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
}

function CreatePost() {
  const { citySlug, channelSlug } = useParams<{
    citySlug: string;
    channelSlug?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [postType, setPostType] = useState<"text" | "link">("text");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    linkUrl: "",
    linkTitle: "",
    linkDescription: "",
  });
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (citySlug) {
      fetchLocationAndChannels();
    }
  }, [citySlug, channelSlug]);

  const fetchLocationAndChannels = async () => {
    try {
      setDataLoading(true);

      // Fetch location
      const locationResponse = await client.models.Location.list({
        filter: { slug: { eq: citySlug }, isActive: { eq: true } },
        authMode: "apiKey",
      });

      if (!locationResponse.data || locationResponse.data.length === 0) {
        setError("City not found");
        return;
      }

      const location = locationResponse.data[0];
      setLocationData({
        id: location.id,
        name: location.name,
        slug: location.slug,
      });

      // Fetch channels for this location
      const channelsResponse = await client.models.Channel.list({
        filter: {
          locationId: { eq: location.id },
          isActive: { eq: true },
        },
        authMode: "apiKey",
      });

      if (channelsResponse.data) {
        const channelData = channelsResponse.data.map((channel) => ({
          id: channel.id,
          name: channel.name,
          slug: channel.slug,
        }));
        setChannels(channelData);

        // If we're in a specific channel, pre-select it
        if (channelSlug) {
          const currentChannel = channelData.find(
            (c) => c.slug === channelSlug,
          );
          if (currentChannel) {
            setSelectedChannel(currentChannel.id);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching location and channels:", err);
      setError("Failed to load location information");
    } finally {
      setDataLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Post title is required");
      return;
    }

    if (postType === "text" && !formData.content.trim()) {
      setError("Post content is required for text posts");
      return;
    }

    if (postType === "link" && !formData.linkUrl.trim()) {
      setError("Link URL is required for link posts");
      return;
    }

    if (!selectedChannel) {
      setError("Please select a channel for your post");
      return;
    }

    if (!locationData) {
      setError("Location not found");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const postData: any = {
        locationId: locationData.id,
        channelId: selectedChannel,
        authorId: user.userId,
        title: formData.title.trim(),
        type: postType,
        isActive: true,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        commentCount: 0,
      };

      if (postType === "text") {
        postData.content = formData.content.trim();
      } else if (postType === "link") {
        postData.linkUrl = formData.linkUrl.trim();
        if (formData.linkTitle.trim()) {
          postData.linkTitle = formData.linkTitle.trim();
        }
        if (formData.linkDescription.trim()) {
          postData.linkDescription = formData.linkDescription.trim();
        }
      }

      const response = await client.models.Post.create(postData);

      if (response.data) {
        // Navigate back to the appropriate view
        if (channelSlug) {
          navigate(`/city/${citySlug}/channel/${channelSlug}`);
        } else {
          navigate(`/city/${citySlug}`);
        }
      }
    } catch (err) {
      console.error("Error creating post:", err);
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (channelSlug) {
      navigate(`/city/${citySlug}/channel/${channelSlug}`);
    } else {
      navigate(`/city/${citySlug}`);
    }
  };

  if (dataLoading) {
    return (
      <View padding="2rem" textAlign="center">
        <Loader size="large" />
        <Text marginTop="1rem">Loading...</Text>
      </View>
    );
  }

  if (error && !locationData) {
    return (
      <View padding="2rem" textAlign="center">
        <Alert variation="error">{error}</Alert>
        <Button onClick={() => navigate("/")} marginTop="1rem">
          Back to Home
        </Button>
      </View>
    );
  }

  return (
    <View padding="2rem" maxWidth="800px" margin="0 auto">
      <Flex direction="column" gap="2rem">
        {/* Header */}
        <View>
          <Button variation="link" onClick={handleCancel} marginBottom="1rem">
            ← Back to {channelSlug ? `#${channelSlug}` : locationData?.name}
          </Button>
          <Heading level={1} color="brand.primary.80">
            Create New Post
          </Heading>
          {locationData && (
            <Text color="font.secondary">
              in {locationData.name}
              {channelSlug && ` → #${channelSlug}`}
            </Text>
          )}
        </View>

        {/* Form */}
        <Card variation="outlined" padding="2rem">
          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="1.5rem">
              {error && (
                <Alert
                  variation="error"
                  isDismissible
                  onDismiss={() => setError(null)}
                >
                  {error}
                </Alert>
              )}

              {/* Channel Selection */}
              {channels.length > 0 && (
                <SelectField
                  label="Channel"
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  required
                  isDisabled={loading || !!channelSlug}
                  descriptiveText={
                    channelSlug
                      ? "Posting to the current channel"
                      : "Choose which channel this post belongs to"
                  }
                >
                  <option value="">Select a channel...</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </SelectField>
              )}

              {/* Post Title */}
              <TextField
                label="Post Title"
                placeholder="What's your post about?"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                isDisabled={loading}
              />

              {/* Post Type Selection */}
              <View>
                <Text fontWeight="bold" marginBottom="1rem">
                  Post Type
                </Text>
                <ToggleButtonGroup
                  value={postType}
                  isExclusive
                  onChange={(value) => setPostType(value as "text" | "link")}
                >
                  <ToggleButton value="text">Text Post</ToggleButton>
                  <ToggleButton value="link">Link Post</ToggleButton>
                </ToggleButtonGroup>
              </View>

              {/* Content based on post type */}
              {postType === "text" && (
                <TextAreaField
                  label="Content"
                  placeholder="Share your thoughts... (Markdown supported)"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={8}
                  isDisabled={loading}
                  descriptiveText="You can use Markdown formatting (bold, italic, links, etc.)"
                />
              )}

              {postType === "link" && (
                <Flex direction="column" gap="1rem">
                  <TextField
                    label="Link URL"
                    placeholder="https://example.com"
                    value={formData.linkUrl}
                    onChange={(e) =>
                      handleInputChange("linkUrl", e.target.value)
                    }
                    type="url"
                    isDisabled={loading}
                    required={postType === "link"}
                  />

                  <TextField
                    label="Link Title (Optional)"
                    placeholder="Title of the linked content"
                    value={formData.linkTitle}
                    onChange={(e) =>
                      handleInputChange("linkTitle", e.target.value)
                    }
                    isDisabled={loading}
                  />

                  <TextAreaField
                    label="Link Description (Optional)"
                    placeholder="Brief description of what this link is about..."
                    value={formData.linkDescription}
                    onChange={(e) =>
                      handleInputChange("linkDescription", e.target.value)
                    }
                    rows={3}
                    isDisabled={loading}
                  />
                </Flex>
              )}

              <Flex direction={{ base: "column", medium: "row" }} gap="1rem">
                <Button
                  type="submit"
                  variation="primary"
                  size="large"
                  isLoading={loading}
                  loadingText="Creating Post..."
                  flex="1"
                >
                  Create Post
                </Button>
                <Button
                  type="button"
                  variation="primary"
                  size="large"
                  onClick={handleCancel}
                  isDisabled={loading}
                  flex="1"
                >
                  Cancel
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>

        {/* Guidelines */}
        <Card variation="outlined" padding="1.5rem">
          <Heading level={3} marginBottom="1rem">
            Posting Guidelines
          </Heading>
          <Flex direction="column" gap="0.5rem">
            <li>Choose a clear, descriptive title</li>
            <li>Post in the most relevant channel</li>
            <li>Be respectful and constructive</li>
            <li>For text posts, you can use Markdown formatting</li>
            <li>For link posts, provide context about why you're sharing</li>
            <li>Follow any specific channel rules</li>
          </Flex>
        </Card>
      </Flex>
    </View>
  );
}

export default withAuthenticator(CreatePost);
