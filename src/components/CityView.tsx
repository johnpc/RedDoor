import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import {
  View,
  Heading,
  Card,
  Collection,
  Button,
  Text,
  Flex,
  Loader,
  Alert,
  Badge,
  Divider,
} from "@aws-amplify/ui-react";
import PostList from "./PostList";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

interface Location {
  id: string;
  name: string;
  slug: string;
  description?: string;
  state?: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  memberCount: number;
  color?: string;
}

export default function CityView() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  const [location, setLocation] = useState<Location | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (citySlug) {
      fetchLocationAndChannels();
    }
  }, [citySlug]);

  const fetchLocationAndChannels = async () => {
    try {
      setLoading(true);

      // Fetch location by slug
      const locationResponse = await client.models.Location.list({
        filter: { slug: { eq: citySlug }, isActive: { eq: true } },
        authMode: "apiKey", // Use API key for public access
      });

      if (!locationResponse.data || locationResponse.data.length === 0) {
        setError("City not found");
        return;
      }

      const locationData = locationResponse.data[0];
      setLocation({
        id: locationData.id,
        name: locationData.name,
        slug: locationData.slug,
        description: locationData.description || undefined,
        state: locationData.state || undefined,
      });

      // Fetch channels for this location
      const channelsResponse = await client.models.Channel.list({
        filter: {
          locationId: { eq: locationData.id },
          isActive: { eq: true },
        },
        authMode: "apiKey",
      });

      if (channelsResponse.errors) {
        throw channelsResponse;
      }

      if (channelsResponse.data) {
        const channelDataPromises = channelsResponse.data.map(
          async (channel) => ({
            id: channel.id,
            name: channel.name,
            slug: channel.slug,
            description: channel.description || undefined,
            postCount:
              (await channel.posts({ authMode: "apiKey" })).data.length || 0,
            memberCount:
              (await channel.memberships({ authMode: "apiKey" })).data.length ||
              0,
            color: channel.color || undefined,
          }),
        );
        const channelData = await Promise.all(channelDataPromises);
        setChannels(channelData);
      }
    } catch (err) {
      console.error("Error fetching location and channels:", err);
      setError("Failed to load city information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChannelClick = (channelSlug: string) => {
    navigate(`/city/${citySlug}/channel/${channelSlug}`);
  };

  const handleCreateChannel = () => {
    navigate(`/city/${citySlug}/create-channel`);
  };

  const handleCreatePost = () => {
    navigate(`/city/${citySlug}/create-post`);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <View padding="2rem" textAlign="center">
        <Loader size="large" />
        <Text marginTop="1rem">Loading city...</Text>
      </View>
    );
  }

  if (error || !location) {
    return (
      <View padding="2rem" textAlign="center">
        <Alert variation="error">{error || "City not found"}</Alert>
        <Button onClick={handleBackToHome} marginTop="1rem">
          Back to Home
        </Button>
      </View>
    );
  }

  return (
    <View padding="2rem" maxWidth="1200px" margin="0 auto">
      <Flex direction="column" gap="2rem">
        {/* Header */}
        <Flex direction="row" alignItems="center" gap="1rem">
          <Button variation="link" onClick={handleBackToHome}>
            ← Back to Communities
          </Button>
        </Flex>

        <View>
          <Heading level={1} color="brand.primary.80">
            {location.name}
          </Heading>
          {location.state && (
            <Text color="font.secondary" fontSize="1.1rem">
              {location.state}, United States
            </Text>
          )}
          {location.description && (
            <Text color="font.tertiary" marginTop="0.5rem">
              {location.description}
            </Text>
          )}
        </View>

        {/* Action Buttons */}
        <Flex direction={{ base: "column", medium: "row" }} gap="1rem">
          <Button
            variation="primary"
            size="large"
            onClick={handleCreatePost}
            isDisabled={!user}
          >
            Create Post
          </Button>
          <Button
            variation="primary"
            size="large"
            onClick={handleCreateChannel}
            isDisabled={!user}
          >
            Create Channel
          </Button>
        </Flex>

        {!user && (
          <Alert variation="info">Sign in to create posts and channels</Alert>
        )}

        {/* Channels Section */}
        <View>
          <Heading level={2} marginBottom="1rem">
            Local Channels
          </Heading>

          {channels.length > 0 ? (
            <Collection items={channels} type="grid" gap="1rem">
              {(channel) => (
                <Card
                  key={channel.id}
                  variation="outlined"
                  padding="1rem"
                  style={{
                    cursor: "pointer",
                    minWidth: "250px",
                    flex: "1 1 250px",
                    borderLeft: channel.color
                      ? `4px solid ${channel.color}`
                      : undefined,
                  }}
                  onClick={() => handleChannelClick(channel.slug)}
                  className="channel-card"
                >
                  <Flex direction="column" gap="0.5rem">
                    <Flex direction="row" alignItems="center" gap="0.5rem">
                      <Heading level={4} color="brand.primary.80">
                        #{channel.name}
                      </Heading>
                    </Flex>

                    {channel.description && (
                      <Text color="font.tertiary" fontSize="0.85rem">
                        {channel.description}
                      </Text>
                    )}

                    <Flex direction="row" gap="1rem" marginTop="0.5rem">
                      <Badge size="small" variation="info">
                        {channel.postCount} posts
                      </Badge>
                      <Badge size="small" variation="success">
                        {channel.memberCount} members
                      </Badge>
                    </Flex>
                  </Flex>
                </Card>
              )}
            </Collection>
          ) : (
            <Card padding="2rem" textAlign="center">
              <Text color="font.secondary">
                No channels created yet for this city.
              </Text>
              <Button
                variation="link"
                onClick={handleCreateChannel}
                marginTop="1rem"
                isDisabled={!user}
              >
                Create the first channel!
              </Button>
            </Card>
          )}
        </View>

        <Divider />

        {/* Posts Section */}
        <View>
          <Heading level={2} marginBottom="1rem">
            All Posts in {location.name}
          </Heading>
          <PostList locationId={location.id} />
        </View>
      </Flex>
    </View>
  );
}
