import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { withAuthenticator } from "@aws-amplify/ui-react";
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
} from "@aws-amplify/ui-react";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

function CreateCity() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    state: "",
    country: "United States",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("City name is required");
      return;
    }

    if (!formData.state.trim()) {
      setError("State is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const slug = generateSlug(formData.name);

      // Check if slug already exists
      const existingLocation = await client.models.Location.list({
        filter: { slug: { eq: slug } },
        authMode: "apiKey",
      });

      if (existingLocation.data && existingLocation.data.length > 0) {
        setError(
          "A city with this name already exists. Please choose a different name.",
        );
        return;
      }

      // Create the location
      const response = await client.models.Location.create(
        {
          name: formData.name.trim(),
          slug,
          state: formData.state.trim(),
          country: formData.country.trim(),
          description: formData.description.trim() || undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        { authMode: "userPool" },
      );

      if (response.data) {
        // Navigate to the new city
        navigate(`/city/${slug}`);
      } else {
        throw response;
      }
    } catch (err) {
      console.error("Error creating city:", err);
      setError("Failed to create city. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <View padding="2rem" maxWidth="800px" margin="0 auto">
      <Flex direction="column" gap="2rem">
        {/* Header */}
        <View>
          <Button variation="link" onClick={handleCancel} marginBottom="1rem">
            ← Back to Communities
          </Button>
          <Heading level={1} color="brand.primary.80">
            Create New City Community
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
                label="City Name"
                placeholder="e.g., Ann Arbor, Chicago, Seattle"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                isDisabled={loading}
              />

              <TextField
                label="State"
                placeholder="e.g., Michigan, Illinois, Washington"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                required
                isDisabled={loading}
              />

              <TextField
                label="Country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                required
                isDisabled={loading}
              />

              <TextAreaField
                label="Description (Optional)"
                placeholder="Tell people what makes this community special..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                isDisabled={loading}
              />

              {formData.name && (
                <Alert variation="info">
                  Your city URL will be:{" "}
                  <strong>/city/{generateSlug(formData.name)}</strong>
                </Alert>
              )}

              <Flex direction={{ base: "column", medium: "row" }} gap="1rem">
                <Button
                  type="submit"
                  variation="primary"
                  size="large"
                  isLoading={loading}
                  loadingText="Creating City..."
                  flex="1"
                >
                  Create City Community
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
            Community Guidelines
          </Heading>
          <Flex direction="column" gap="0.5rem">
            <li>Choose a clear, recognizable city name</li>
            <li>Provide accurate location information</li>
            <li>Write a welcoming description for your community</li>
            <li>Be respectful and inclusive in your community setup</li>
            <li>Consider what local channels might be useful for your city</li>
          </Flex>
        </Card>
      </Flex>
    </View>
  );
}

export default withAuthenticator(CreateCity);
