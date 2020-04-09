// @flow

import React from 'react';
import { StyleSheet, View, TouchableHighlight } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Amplitude from 'expo-analytics-amplitude';
import { Text, Title } from '../components/shared/Typography';
import Colors from '../constants/Colors';
import {
  getMeetingFrequency,
  getMeetingDay,
  getMeetingTime,
} from '../utils/groups';

export default ({
  item,
}: {
  item: {
    name: string,
    campus: string,
    frequency: number,
    interval: string,
    daysOfWeek: Array<string>,
    dayOfMonth: string,
    meetingTime: string,
    description: string,
  },
}) => {
  const navigation = useNavigation();
  const {
    name = '',
    campus,
    frequency,
    interval,
    daysOfWeek,
    dayOfMonth,
    meetingTime,
    description,
  } = item;
  const titleParts = name.split('-');

  if (titleParts.length > 1) {
    titleParts.shift();
  }

  const title = titleParts.join(' ').trim();

  return (
    <TouchableHighlight
      style={styles.cardHighlight}
      underlayColor={Colors.darkestGray}
      onPress={() => {
        Amplitude.logEventWithProperties('OPEN Group Details', {
          group: title,
        });
        navigation.navigate('GroupDetails', {
          group: { ...item, title },
        });
      }}
    >
      <View style={styles.group}>
        <Title
          light
          adjustsFontSizeToFit
          numberOfLines={2}
          style={styles.title}
        >
          {title}
        </Title>

        <View style={styles.when}>
          <Text>
            {getMeetingFrequency(frequency, interval)} on{' '}
            <Text bold>{getMeetingDay(daysOfWeek, dayOfMonth)}</Text> at{' '}
            <Text bold>{getMeetingTime(meetingTime)}</Text>
          </Text>
        </View>

        <View style={styles.details}>
          <Text bold>{campus}</Text>
        </View>

        <View style={styles.descriptionWrapper}>
          <Text numberOfLines={4} light>
            {description}
          </Text>
        </View>
      </View>
    </TouchableHighlight>
  );
};

export const styles = StyleSheet.create({
  cardHighlight: { borderRadius: 16 },
  group: {
    height: 250,
    padding: 16,
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  title: {
    marginTop: 16,
    marginBottom: 10,
  },
  details: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  when: {
    marginBottom: 10,
    justifyContent: 'center',
  },
  descriptionWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
});
