import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateClient } from "aws-amplify/data";
import {
  View,
  Heading,
  Card,
  Collection,
  Button,
  Text,
  Flex,
  SearchField,
  Loader,
  Alert,
} from "@aws-amplify/ui-react";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

interface Location {
  id: string;
  name: string;
  slug: string;
  description?: string;
  state?: string;
  country?: string;
}

export default function LandingPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = locations.filter(
        (location) =>
          location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.state?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [searchTerm, locations]);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await client.models.Location.list({
        authMode: "apiKey", // Use API key for public access
      });

      if (response.data) {
        const locationData = response.data.map((location) => ({
          id: location.id,
          name: location.name,
          slug: location.slug,
          description: location.description || undefined,
          state: location.state || undefined,
          country: location.country || undefined,
        }));
        setLocations(locationData);
        setFilteredLocations(locationData);
      }
    } catch (err) {
      console.error("Error fetching locations:", err);
      setError("Failed to load locations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (slug: string) => {
    navigate(`/city/${slug}`);
  };

  const handleCreateCity = () => {
    navigate("/create-city");
  };

  if (loading) {
    return (
      <View padding="2rem" textAlign="center">
        <Loader size="large" />
        <Text marginTop="1rem">Loading communities...</Text>
      </View>
    );
  }

  return (
    <View padding="2rem" maxWidth="1200px" margin="0 auto">
      <Flex direction="column" gap="2rem">
        {/* Header */}
        <View textAlign="center">
          <Heading level={1} color="brand.primary.80">
            Welcome to RedDoor
          </Heading>
          <Text fontSize="1.2rem" color="font.secondary">
            Connect with your local community
          </Text>
        </View>

        {/* Search and Create */}
        <Flex
          direction={{ base: "column", medium: "row" }}
          gap="1rem"
          alignItems="center"
        >
          <SearchField
            label="Search communities"
            placeholder="Search by city or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm("")}
            size="large"
            flex="1"
          />
          <Button variation="primary" size="large" onClick={handleCreateCity}>
            Create New City
          </Button>
        </Flex>

        {/* Error Display */}
        {error && (
          <Alert
            variation="error"
            isDismissible
            onDismiss={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Locations Grid */}
        {filteredLocations.length > 0 ? (
          <Collection items={filteredLocations} type="grid" gap="1rem">
            {(location) => (
              <Card
                key={location.id}
                variation="outlined"
                padding="1.5rem"
                style={{
                  cursor: "pointer",
                  minWidth: "280px",
                  flex: "1 1 300px",
                }}
                onClick={() => handleLocationSelect(location.slug)}
                className="location-card"
              >
                <Flex direction="column" gap="0.5rem">
                  <Heading level={3} color="brand.primary.80">
                    {location.name}
                  </Heading>
                  {location.state && (
                    <Text color="font.secondary" fontSize="0.9rem">
                      {location.state}, {location.country || "United States"}
                    </Text>
                  )}
                  {location.description && (
                    <Text color="font.tertiary" fontSize="0.85rem">
                      {location.description}
                    </Text>
                  )}
                </Flex>
              </Card>
            )}
          </Collection>
        ) : (
          <View textAlign="center" padding="3rem">
            <Text fontSize="1.1rem" color="font.secondary">
              {searchTerm
                ? "No communities found matching your search."
                : "No communities available yet."}
            </Text>
            <Button
              variation="link"
              size="large"
              onClick={handleCreateCity}
              marginTop="1rem"
            >
              Be the first to create a community!
            </Button>
          </View>
        )}
      </Flex>
    </View>
  );
}
