import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import {
  View,
  Heading,
  Button,
  Text,
  Flex,
  Loader,
  Alert,
  Badge,
  Card,
} from "@aws-amplify/ui-react";
import PostList from "./PostList";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

interface Location {
  id: string;
  name: string;
  slug: string;
}

interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  rules?: string;
  postCount: number;
  memberCount: number;
  color?: string;
}

export default function ChannelView() {
  const { citySlug, channelSlug } = useParams<{
    citySlug: string;
    channelSlug: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  const [location, setLocation] = useState<Location | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (citySlug && channelSlug) {
      fetchLocationAndChannel();
    }
  }, [citySlug, channelSlug]);

  const fetchLocationAndChannel = async () => {
    try {
      setLoading(true);

      // Fetch location by slug
      const locationResponse = await client.models.Location.list({
        filter: { slug: { eq: citySlug }, isActive: { eq: true } },
        authMode: "apiKey",
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
      });

      // Fetch channel by slug and location
      const channelResponse = await client.models.Channel.list({
        filter: {
          slug: { eq: channelSlug },
          locationId: { eq: locationData.id },
          isActive: { eq: true },
        },
        authMode: "apiKey",
      });

      if (!channelResponse.data || channelResponse.data.length === 0) {
        setError("Channel not found");
        return;
      }

      const channelData = channelResponse.data[0];
      setChannel({
        id: channelData.id,
        name: channelData.name,
        slug: channelData.slug,
        description: channelData.description || undefined,
        rules: channelData.rules || undefined,
        postCount: channelData.postCount || 0,
        memberCount: channelData.memberCount || 0,
        color: channelData.color || undefined,
      });
    } catch (err) {
      console.error("Error fetching location and channel:", err);
      setError("Failed to load channel information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    navigate(`/city/${citySlug}/channel/${channelSlug}/create-post`);
  };

  const handleBackToCity = () => {
    navigate(`/city/${citySlug}`);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <View padding="2rem" textAlign="center">
        <Loader size="large" />
        <Text marginTop="1rem">Loading channel...</Text>
      </View>
    );
  }

  if (error || !location || !channel) {
    return (
      <View padding="2rem" textAlign="center">
        <Alert variation="error">{error || "Channel not found"}</Alert>
        <Flex
          direction="row"
          gap="1rem"
          justifyContent="center"
          marginTop="1rem"
        >
          <Button onClick={handleBackToCity}>Back to {citySlug}</Button>
          <Button variation="link" onClick={handleBackToHome}>
            Back to Home
          </Button>
        </Flex>
      </View>
    );
  }

  return (
    <View padding="2rem" maxWidth="1200px" margin="0 auto">
      <Flex direction="column" gap="2rem">
        {/* Navigation */}
        <Flex direction="row" alignItems="center" gap="1rem" wrap="wrap">
          <Button variation="link" onClick={handleBackToHome}>
            Home
          </Button>
          <Text color="font.tertiary">→</Text>
          <Button variation="link" onClick={handleBackToCity}>
            {location.name}
          </Button>
          <Text color="font.tertiary">→</Text>
          <Text color="font.secondary">#{channel.name}</Text>
        </Flex>

        {/* Channel Header */}
        <Card
          variation="outlined"
          padding="2rem"
          style={{
            borderLeft: channel.color
              ? `6px solid ${channel.color}`
              : undefined,
          }}
        >
          <Flex direction="column" gap="1rem">
            <Flex direction="row" alignItems="center" gap="1rem" wrap="wrap">
              <Heading level={1} color="brand.primary.80">
                #{channel.name}
              </Heading>
              <Badge size="small" variation="info">
                {channel.postCount} posts
              </Badge>
              <Badge size="small" variation="success">
                {channel.memberCount} members
              </Badge>
            </Flex>

            {channel.description && (
              <Text fontSize="1.1rem" color="font.secondary">
                {channel.description}
              </Text>
            )}

            {channel.rules && (
              <Card variation="outlined" padding="1rem">
                <Heading level={4} marginBottom="0.5rem">
                  Channel Rules
                </Heading>
                <Text fontSize="0.9rem" color="font.tertiary">
                  {channel.rules}
                </Text>
              </Card>
            )}
          </Flex>
        </Card>

        {/* Action Buttons */}
        <Flex direction={{ base: "column", medium: "row" }} gap="1rem">
          <Button
            variation="primary"
            size="large"
            onClick={handleCreatePost}
            isDisabled={!user}
          >
            Create Post in #{channel.name}
          </Button>
        </Flex>

        {!user && (
          <Alert variation="info">
            Sign in to create posts in this channel
          </Alert>
        )}

        {/* Posts Section */}
        <View>
          <Heading level={2} marginBottom="1rem">
            Posts in #{channel.name}
          </Heading>
          <PostList channelId={channel.id} />
        </View>
      </Flex>
    </View>
  );
}
