import React, { useState, useEffect } from 'react';
import {
  AsyncStorage,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useScrollToTop } from '@react-navigation/native';
import * as Amplitude from 'expo-analytics-amplitude';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import collectChannelData from '../data/youtube';
import Colors from '../constants/Colors';
import useHandleTabChange from '../utils/useHandleTabChange';
import isTheWeekend from '../utils/isTheWeekend';
import { Text, Subtitle, Heading } from '../components/shared/Typography';
import Button from '../components/shared/Button';
import Spinner from '../components/shared/Spinner';
import LiveCard from '../components/LiveCard';

const screenWidth = Dimensions.get('window').width;
const storeMediaData = async (data) => {
  await AsyncStorage.setItem('@media', JSON.stringify(data)).catch((err) =>
    console.error(err)
  );
};
const getStoredMedia = () => {
  return AsyncStorage.getItem('@media').catch((err) => console.error(err));
};

const MediaScreen = () => {
  useHandleTabChange('Media');
  const insets = useSafeArea();
  const ref = React.useRef(null);

  useScrollToTop(ref);

  const [isLoading, setLoading] = useState(true);
  const [isError, setError] = useState(false);
  const [data, setData] = useState([]);

  useEffect(() => {
    getVideos();
  }, []);

  async function getVideos() {
    try {
      const storedMedia = await getStoredMedia();

      if (storedMedia) {
        setData(JSON.parse(storedMedia));
        setLoading(false);
      }

      const fetchedVideos = (await collectChannelData()) || [];

      setData(fetchedVideos);
      setLoading(false);
      storeMediaData(fetchedVideos);
    } catch (err) {
      setError(true);
      setLoading(false);
      Amplitude.logEventWithProperties('ERROR loading media', { error: err });
    }
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { flex: 1, paddingTop: insets.top }]}>
        <Text XXL bold style={styles.headerTitle}>
          MEDIA
        </Text>
        <Spinner />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text XXL bold style={styles.headerTitle}>
          MEDIA
        </Text>
        <View style={styles.error}>
          <Subtitle center>
            Oh no! There was an error connecting to YouTube 😞
          </Subtitle>
          <Heading center>
            {`Make sure you're connected to the internet`}
          </Heading>
          <Button
            title={'Retry'}
            style={styles.notesButton}
            onPress={() => {
              setError(false);
              setLoading(true);
              getVideos();
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      ref={ref}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <Text XXL bold style={styles.headerTitle}>
        MEDIA
      </Text>

      {isTheWeekend && (
        <>
          <TouchableHighlight
            onPress={() => {
              Amplitude.logEvent('TAP Watch Live');
              WebBrowser.openBrowserAsync('https://live.echo.church', {
                toolbarColor: Colors.darkestGray,
              }).catch((err) => {
                Amplitude.logEventWithProperties('ERROR with WebBrowser', {
                  error: err,
                });
                WebBrowser.dismissBrowser();
              });
            }}
          >
            <LiveCard style={styles.largeCard} />
          </TouchableHighlight>
        </>
      )}

      <Subtitle style={styles.sectionHeaderText}>CURRENT SERIES</Subtitle>
      <YouTubeDataView
        style={styles.largeCard}
        data={data[0]}
        thumbnailStyle={styles.youtubeThumbnailImageLarge}
      />
      <Button
        icon={
          <MaterialIcons name={'speaker-notes'} size={24} color={Colors.gray} />
        }
        title="Message Notes"
        style={styles.notesButton}
        onPress={() => {
          Amplitude.logEvent('TAP Message Notes');
          Linking.openURL('https://echo.church/messagenotes');
        }}
      />

      <Subtitle style={styles.sectionHeaderText}>PAST SERIES</Subtitle>
      <PastSeriesSection data={data.slice(1, data.length)} />

      <Subtitle style={styles.sectionHeaderText}>RESOURCES</Subtitle>
      <TouchableHighlight
        style={{ marginBottom: insets.bottom + 16 }}
        onPress={() => {
          Amplitude.logEvent('TAP Rightnow Media');
          Linking.openURL(
            'https://www.rightnowmedia.org/Account/Invite/EchoChurch'
          );
        }}
      >
        <Image
          source={require('../assets/images/rightnow_media.jpg')}
          style={[
            styles.youtubeThumbnailImageLarge,
            { height: screenWidth / 2, marginLeft: 16, marginBottom: 16 },
          ]}
          resizeMode="cover"
        />
      </TouchableHighlight>
    </ScrollView>
  );
};

const takeToItem = ({ id, title } = {}) => {
  Amplitude.logEventWithProperties('TAP Past Series', {
    series_name: title,
  });

  Linking.openURL(`https://www.youtube.com/playlist?list=${id}`);
};

const PastSeriesSection = ({ data }) => {
  if (data === null || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.list}>
      {data.map((item) => {
        if (item) {
          return (
            <YouTubeDataView
              key={item.title}
              data={item}
              thumbnailStyle={styles.youtubeThumbnailImageSmall}
              style={styles.smallCard}
            />
          );
        }
        return null;
      })}
    </View>
  );
};

const YouTubeDataView = ({ data = {}, style, thumbnailStyle } = {}) => {
  const { thumbnails: { maxres = {} } = {} } = data;

  return (
    <TouchableOpacity
      onPress={() => {
        takeToItem(data);
      }}
    >
      <View style={style}>
        <Image
          source={{ uri: maxres.url }}
          style={thumbnailStyle}
          resizeMode="cover"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.headerBackground,
  },
  error: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  headerTitle: {
    marginVertical: 10,
    marginLeft: 16,
    color: Colors.red,
  },
  sectionHeaderText: {
    marginLeft: 16,
  },
  largeCard: {
    width: screenWidth - 32,
    height: (screenWidth - 32) / 2,
    marginLeft: 16,
    borderRadius: 8,
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  smallCard: {
    width: (screenWidth - 48) / 2,
    height: (2 * (screenWidth - 48)) / 7,
    marginBottom: 32,
    marginLeft: 16,
    borderRadius: 0,
  },
  notesButton: {
    margin: 16,
    marginBottom: 30,
    width: screenWidth - 32,
  },
  youtubeThumbnailImageSmall: {
    flex: 1,
    height: undefined,
    width: (screenWidth - 48) / 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  youtubeThumbnailImageLarge: {
    flex: 1,
    borderRadius: 8,
    height: undefined,
    width: screenWidth - 32,
    overflow: 'hidden',
  },
});

export default MediaScreen;
