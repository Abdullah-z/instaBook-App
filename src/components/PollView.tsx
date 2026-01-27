import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import { votePollAPI } from '../api/postAPI';
import { AuthContext } from '../auth/AuthContext';
import { useContext, useState } from 'react';

const { width } = Dimensions.get('window');

interface PollOption {
  text: string;
  votes: string[];
  _id: string;
}

interface Props {
  postId: string;
  question: string;
  options: PollOption[];
  onUpdate: (newPost: any) => void;
}

const PollView: React.FC<Props> = ({ postId, question, options, onUpdate }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState<string | null>(null);

  const totalVotes = options.reduce((acc, curr) => acc + curr.votes.length, 0);

  const handleVote = async (index: number) => {
    if (loading) return;
    setLoading(options[index]._id);
    try {
      const res = await votePollAPI(postId, index);
      onUpdate(res.newPost);
    } catch (err) {
      console.error('Vote error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
      ]}>
      <Text style={[styles.question, { color: theme.colors.onSurface }]}>{question}</Text>
      {options.map((option, index) => {
        const isVoted = user?._id ? option.votes.includes(user._id) : false;
        const percentage = totalVotes === 0 ? 0 : (option.votes.length / totalVotes) * 100;

        return (
          <TouchableOpacity
            key={option._id}
            onPress={() => handleVote(index)}
            disabled={!!loading}
            style={[
              styles.optionContainer,
              { backgroundColor: theme.colors.surfaceVariant + '08', borderColor: 'transparent' },
            ]}>
            <View
              style={[
                styles.progressBar,
                { width: `${percentage}%`, backgroundColor: theme.colors.primaryContainer },
              ]}
            />
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionText,
                  { color: theme.colors.onSurfaceVariant },
                  isVoted && [styles.votedText, { color: theme.colors.primary }],
                ]}>
                {option.text}
              </Text>
              <Text style={[styles.percentText, { color: theme.colors.onSurfaceVariant }]}>
                {Math.round(percentage)}%
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
      <Text style={[styles.totalVotes, { color: theme.colors.onSurfaceVariant }]}>
        {totalVotes} votes
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 24,
    marginVertical: 10,
    borderWidth: 1,
  },
  question: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 24,
  },
  optionContainer: {
    height: 48,
    borderRadius: 16,
    marginBottom: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    alignItems: 'center',
    zIndex: 1,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  votedText: {
    fontWeight: 'bold',
  },
  percentText: {
    fontSize: 14,
  },
  totalVotes: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 5,
  },
});

export default PollView;
