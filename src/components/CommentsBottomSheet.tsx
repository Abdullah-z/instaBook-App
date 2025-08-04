import React, { forwardRef, useMemo } from 'react';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ActivityIndicator, StyleSheet } from 'react-native';
import CommentsScreen from '../screens/CommentScreen';

const CommentsBottomSheet = forwardRef(({ post }, ref) => {
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  return (
    <BottomSheet
      ref={ref}
      snapPoints={snapPoints}
      index={-1}
      enablePanDownToClose
      keyboardBehavior="interactive"
      enableDynamicSizing={false}
      keyboardBlurBehavior="restore">
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
        {post ? <CommentsScreen post={post} /> : <ActivityIndicator />}
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 200,
  },
  contentContainer: {
    backgroundColor: 'white',
  },
  itemContainer: {
    padding: 6,
    margin: 6,
    backgroundColor: '#eee',
  },
});

export default CommentsBottomSheet;
