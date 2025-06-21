import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/shadowStyles';

export const XPDisplayCard: React.FC = () => {
  const { totalXp, loadingXp } = useAuth();

  const milestones = [
    { name: 'Woof Wrangler', minXp: 0 },
    { name: 'Pawfessional', minXp: 1000 },
    { name: 'Leash Legend', minXp: 2500 },
    { name: 'Top Dog', minXp: 5000 },
    { name: 'Dogédex Master', minXp: 10000 },
  ];

  const currentXp = loadingXp ? 0 : totalXp ?? 0;

  let currentMilestone = milestones[0];
  let nextMilestoneXp = milestones[1]?.minXp ?? currentXp; // Default for last milestone
  let currentMilestoneMinXp = 0;

  for (let i = milestones.length - 1; i >= 0; i--) {
    if (currentXp >= milestones[i].minXp) {
      currentMilestone = milestones[i];
      currentMilestoneMinXp = milestones[i].minXp;
      if (i < milestones.length - 1) {
        nextMilestoneXp = milestones[i + 1].minXp;
      } else {
        // For the last milestone, the "next" could be considered the same, making progress 100% if achieved
        // or we can define a conceptual "max" if needed, for now, it means it's the top tier.
        nextMilestoneXp = currentMilestone.minXp; // Or treat as 100% full if currentXp >= minXp
      }
      break;
    }
  }

  let progressPercentage = 0;
  if (currentMilestone.name === 'Dogédex Master') {
    progressPercentage = currentXp >= currentMilestone.minXp ? 100 : 0; // Full if master, else 0 (should not happen if logic is right)
     // Or if currentXp >= currentMilestone.minXp, it's 100%.
    if (currentXp >= currentMilestone.minXp) {
        progressPercentage = 100;
    } else { // Should ideally not hit this if logic for finding currentMilestone is correct
        const previousMilestone = milestones[milestones.length - 2];
        const xpInTier = currentXp - previousMilestone.minXp;
        const tierTotalXp = currentMilestone.minXp - previousMilestone.minXp;
        progressPercentage = tierTotalXp > 0 ? Math.max(0, Math.min((xpInTier / tierTotalXp) * 100, 100)) : 0;
    }

  } else {
    const xpInCurrentMilestoneTier = currentXp - currentMilestoneMinXp;
    const xpNeededForNextMilestoneTier = nextMilestoneXp - currentMilestoneMinXp;
    if (xpNeededForNextMilestoneTier > 0) {
      progressPercentage = Math.max(0, Math.min((xpInCurrentMilestoneTier / xpNeededForNextMilestoneTier) * 100, 100));
    } else { // Should only happen if currentMilestoneMinXp === nextMilestoneXp (e.g. for Dogedex Master if not handled above)
      progressPercentage = currentXp >= currentMilestoneMinXp ? 100 : 0;
    }
  }


  let xpToNextText = '';
  if (currentMilestone.name === 'Dogédex Master' && currentXp >= currentMilestone.minXp) {
    xpToNextText = "You've reached the highest rank!";
  } else if (nextMilestoneXp > currentXp) {
    const xpNeeded = nextMilestoneXp - currentXp;
    xpToNextText = `${xpNeeded.toLocaleString()} XP to ${milestones.find(m => m.minXp === nextMilestoneXp)?.name || 'next rank'}`;
  }


  return (
    <View style={styles.cardContainer}>
      <Text style={styles.xpLabelText}>Current XP</Text>
      <Text style={styles.xpValueText}>
        {loadingXp ? '...' : currentXp.toLocaleString()}
      </Text>
      <Text style={styles.milestoneText}>{currentMilestone.name}</Text>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
      </View>
      {xpToNextText ? <Text style={styles.xpToNextText}>{xpToNextText}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FF8C00', // DarkOrange
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3, // For Android
    }),
  },
  xpLabelText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '600', // Added for better visibility
  },
  xpValueText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4, // Adjusted margin
  },
  milestoneText: { // Added style for milestone
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 8, // Added margin for text below
  },
  xpToNextText: { // Added style for XP to next milestone text
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
  },
});

export default XPDisplayCard;