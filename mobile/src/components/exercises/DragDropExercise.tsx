import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

interface DragDropItem {
  id: string;
  content: string;
  category: string;
}

interface DropZone {
  id: string;
  label: string;
  accepts: string[];
}

interface DragDropExerciseProps {
  question: string;
  items: DragDropItem[];
  zones: DropZone[];
  onComplete: (isCorrect: boolean) => void;
}

const Draggable = ({ item, onDrop }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      // Check if the item is dropped in a valid zone
      // This is a simplified version. A real implementation would need to
      // measure the position of the drop zones and check for overlap.
      runOnJS(onDrop)(item);
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.draggable, animatedStyle]}>
        <Text style={styles.draggableText}>{item.content}</Text>
      </Animated.View>
    </PanGestureHandler>
  );
};

const DragDropExercise: React.FC<DragDropExerciseProps> = ({
  question,
  items,
  zones,
  onComplete,
}) => {
  const [availableItems, setAvailableItems] = useState(items);
  const [dropZones, setDropZones] = useState(
    zones.map((zone) => ({ ...zone, items: [] }))
  );

  const handleDrop = (item: DragDropItem) => {
    // This is a simplified version. A real implementation would need to
    // find the correct drop zone based on the drop position.
    const zone = dropZones[0]; // Assume the first zone is the target
    if (zone.accepts.includes(item.category)) {
      setAvailableItems((prev) => prev.filter((i) => i.id !== item.id));
      setDropZones((prev) =>
        prev.map((z) =>
          z.id === zone.id ? { ...z, items: [...z.items, item] } : z
        )
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.itemsContainer}>
        {availableItems.map((item) => (
          <Draggable key={item.id} item={item} onDrop={handleDrop} />
        ))}
      </View>
      <View style={styles.zonesContainer}>
        {dropZones.map((zone) => (
          <View key={zone.id} style={styles.droppable}>
            <Text style={styles.droppableLabel}>{zone.label}</Text>
            {zone.items.map((item) => (
              <View key={item.id} style={styles.droppedItem}>
                <Text style={styles.droppedItemText}>{item.content}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    itemsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 20,
    },
    zonesContainer: {
        alignItems: 'center',
    },
    draggable: {
        padding: 10,
        margin: 5,
        backgroundColor: '#6D28D9',
        borderRadius: 5,
    },
    draggableText: {
        color: 'white',
        fontWeight: 'bold',
    },
    droppable: {
        width: '100%',
        padding: 20,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        minHeight: 100,
    },
    droppableLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    droppedItem: {
        padding: 10,
        margin: 5,
        backgroundColor: '#10B981',
        borderRadius: 5,
    },
    droppedItemText: {
        color: 'white',
        fontWeight: 'bold',
    },
});

export default DragDropExercise;
