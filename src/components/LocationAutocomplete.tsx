import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { TextInput, Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface Suggestion {
  description: string;
  coordinates: [number, number]; // [lon, lat]
}

interface LocationAutocompleteProps {
  onLocationSelect: (address: string, coordinates: [number, number]) => void;
  initialValue?: string;
  placeholder?: string;
  isLoading?: boolean;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  onLocationSelect,
  initialValue = '',
  placeholder = 'Enter location address...',
  isLoading = false,
}) => {
  const theme = useTheme();
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
      let response;
      try {
        // 1. Try HTTPS first (standard)
        response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lang=en`,
          { headers: { Accept: 'application/json' } }
        );
      } catch (e) {
        // 2. Fallback to HTTP (helps on some networks with SSL/DNS issues)
        console.log('HTTPS search failed, trying HTTP fallback...');
        response = await fetch(
          `http://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5&lang=en`,
          { headers: { Accept: 'application/json' } }
        );
      }

      if (!response.ok) {
        throw new Error(`Cloud search error: ${response.status}`);
      }

      const data = await response.json();

      const formattedSuggestions: Suggestion[] = data.features.map((feature: any) => {
        const p = feature.properties;
        const parts = [
          p.name,
          p.street,
          p.city || p.town || p.village,
          p.state || p.county,
          p.country,
        ].filter(Boolean);

        return {
          description: parts.join(', '),
          coordinates: feature.geometry.coordinates, // [lon, lat]
        };
      });

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (error: any) {
      console.error('Location search error details:', error);
      // We don't alert here to avoid annoying the user during typing,
      // but the log will help us debug.
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
        value={query}
        onChangeText={handleTextChange}
        style={[
          styles.input,
          { backgroundColor: theme.colors.surface, color: theme.colors.onSurface },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        mode="flat"
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        textColor={theme.colors.onSurface}
        left={<TextInput.Icon icon="magnify" color={theme.colors.onSurfaceVariant} />}
        right={
          loading || isLoading ? (
            <TextInput.Icon
              icon={() => <ActivityIndicator size="small" color={theme.colors.onSurface} />}
            />
          ) : query.length > 0 ? (
            <TextInput.Icon
              icon="close-circle"
              color={theme.colors.onSurfaceVariant}
              onPress={() => handleTextChange('')}
            />
          ) : null
        }
      />

      {showSuggestions && (
        <Surface
          style={[styles.suggestionsContainer, { backgroundColor: theme.colors.surface }]}
          elevation={4}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.suggestionItem, { borderBottomColor: theme.colors.outlineVariant }]}
                onPress={() => handleSelect(item)}>
                <View
                  style={[styles.suggestionIconWrapper, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="location" size={18} color={theme.colors.onPrimary} />
                </View>
                <View style={styles.suggestionTextWrapper}>
                  <Text
                    style={[styles.suggestionTitle, { color: theme.colors.onSurface }]}
                    numberOfLines={1}>
                    {item.description.split(',')[0]}
                  </Text>
                  <Text
                    style={[styles.suggestionSub, { color: theme.colors.onSurfaceVariant }]}
                    numberOfLines={1}>
                    {item.description.split(',').slice(1).join(',').trim()}
                  </Text>
                </View>
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
    borderRadius: 15,
    height: 50,
    fontSize: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 15,
    maxHeight: 280,
    zIndex: 1001,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  list: {
    paddingVertical: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIconWrapper: {
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionTextWrapper: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  suggestionSub: {
    fontSize: 12,
    color: '#888',
  },
});

export default LocationAutocomplete;
