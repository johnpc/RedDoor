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
  Flex,
  Alert,
  Loader,
  Text,
} from "@aws-amplify/ui-react";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

interface Location {
  id: string;
  name: string;
  slug: string;
}

function CreateChannel() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthenticator((context) => [context.user]);

  const [location, setLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rules: "",
    color: "#3b82f6",
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (citySlug) {
      fetchLocation();
    }
  }, [citySlug]);

  const fetchLocation = async () => {
    try {
      setLocationLoading(true);
      const response = await client.models.Location.list({
        filter: { slug: { eq: citySlug }, isActive: { eq: true } },
        authMode: "apiKey",
      });

      if (!response.data || response.data.length === 0) {
        setError("City not found");
        return;
      }

      setLocation({
        id: response.data[0].id,
        name: response.data[0].name,
        slug: response.data[0].slug,
      });
    } catch (err) {
      console.error("Error fetching location:", err);
      setError("Failed to load city information");
    } finally {
      setLocationLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Channel name is required");
      return;
    }

    if (!location) {
      setError("Location not found");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const slug = generateSlug(formData.name);

      // Check if channel slug already exists in this location
      const existingChannel = await client.models.Channel.list({
        filter: {
          slug: { eq: slug },
          locationId: { eq: location.id },
        },
        authMode: "apiKey",
      });

      if (existingChannel.data && existingChannel.data.length > 0) {
        setError(
          "A channel with this name already exists in this city. Please choose a different name.",
        );
        return;
      }

      // Create the channel
      const response = await client.models.Channel.create({
        locationId: location.id,
        name: formData.name.trim(),
        slug,
        description: formData.description.trim() || undefined,
        rules: formData.rules.trim() || undefined,
        color: formData.color,
        isActive: true,
        createdBy: user.userId,
        memberCount: 0,
        postCount: 0,
        createdAt: new Date().toISOString(),
      });

      if (response.data) {
        // Navigate to the new channel
        navigate(`/city/${citySlug}/channel/${slug}`);
      }
    } catch (err) {
      console.error("Error creating channel:", err);
      setError("Failed to create channel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/city/${citySlug}`);
  };

  if (locationLoading) {
    return (
      <View padding="2rem" textAlign="center">
        <Loader size="large" />
        <Text marginTop="1rem">Loading city information...</Text>
      </View>
    );
  }

  if (error && !location) {
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
            ← Back to {location?.name}
          </Button>
          <Heading level={1} color="brand.primary.80">
            Create New Channel in {location?.name}
          </Heading>
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

              <TextField
                label="Channel Name"
                placeholder="e.g., politics, golf, restaurants, events"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                isDisabled={loading}
                descriptiveText="Choose a clear, descriptive name for your channel topic"
              />

              <TextAreaField
                label="Description"
                placeholder="What is this channel about? What kind of discussions should happen here?"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                isDisabled={loading}
                descriptiveText="Help people understand what this channel is for"
              />

              <TextAreaField
                label="Channel Rules (Optional)"
                placeholder="Any specific rules or guidelines for this channel..."
                value={formData.rules}
                onChange={(e) => handleInputChange("rules", e.target.value)}
                rows={4}
                isDisabled={loading}
                descriptiveText="Set expectations for how people should behave in this channel"
              />

              <View>
                <Text fontWeight="bold" marginBottom="0.5rem">
                  Channel Color
                </Text>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange("color", e.target.value)}
                  disabled={loading}
                  style={{
                    width: "60px",
                    height: "40px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                />
                <Text
                  fontSize="0.85rem"
                  color="font.tertiary"
                  marginTop="0.25rem"
                >
                  Choose a color to help identify your channel
                </Text>
              </View>

              {formData.name && (
                <Alert variation="info">
                  Your channel URL will be:{" "}
                  <strong>
                    /city/{citySlug}/channel/{generateSlug(formData.name)}
                  </strong>
                </Alert>
              )}

              <Flex direction={{ base: "column", medium: "row" }} gap="1rem">
                <Button
                  type="submit"
                  variation="primary"
                  size="large"
                  isLoading={loading}
                  loadingText="Creating Channel..."
                  flex="1"
                >
                  Create Channel
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
            Channel Guidelines
          </Heading>
          <Flex direction="column" gap="0.5rem">
            <li>Choose a clear, specific topic for your channel</li>
            <li>Write a helpful description so people know what to expect</li>
            <li>Consider what rules might help keep discussions productive</li>
            <li>Pick a color that represents your channel's theme</li>
            <li>Make sure your channel adds value to the community</li>
          </Flex>
        </Card>
      </Flex>
    </View>
  );
}

export default withAuthenticator(CreateChannel);
