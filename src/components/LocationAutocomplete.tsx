import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { TextInput, Text, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Suggestion {
  description: string;
  coordinates: [number, number]; // [lon, lat]
}

interface LocationAutocompleteProps {
  onLocationSelect: (address: string, coordinates: [number, number]) => void;
  initialValue?: string;
  placeholder?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onLocationSelect,
  initialValue = '',
  placeholder = 'Enter location address...',
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const searchLocation = async (text: string) => {
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      // Using Photon API (OpenStreetMap based) - free and no key required
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`
      );
      const data = await response.json();

      const formattedSuggestions: Suggestion[] = data.features.map((feature: any) => {
        const p = feature.properties;
        const parts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);

        return {
          description: parts.join(', '),
          coordinates: feature.geometry.coordinates, // [lon, lat]
        };
      });

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => searchLocation(text), 500);
  };

  const handleSelect = (item: Suggestion) => {
    setQuery(item.description);
    setShowSuggestions(false);
    onLocationSelect(item.description, item.coordinates);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Location Address"
        value={query}
        onChangeText={handleTextChange}
        style={styles.input}
        mode="outlined"
        placeholder={placeholder}
        right={
          loading ? (
            <TextInput.Icon icon={() => <ActivityIndicator size="small" />} />
          ) : (
            <TextInput.Icon icon="magnify" />
          )
        }
      />

      {showSuggestions && (
        <Surface style={styles.suggestionsContainer} elevation={4}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSelect(item)}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
          />
        </Surface>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    position: 'relative',
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 250,
    zIndex: 1001,
  },
  list: {
    borderRadius: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  icon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default LocationAutocomplete;
