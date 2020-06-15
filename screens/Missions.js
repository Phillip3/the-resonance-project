import React, { useState, useEffect } from 'react';
import {
  AsyncStorage,
  Image,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { HeaderHeightContext } from '@react-navigation/stack';
import { Placeholder, PlaceholderLine, Fade } from 'rn-placeholder';
import * as WebBrowser from 'expo-web-browser';
import * as Amplitude from 'expo-analytics-amplitude';
import htmlParser from 'fast-html-parser';
import Colors from '../constants/Colors';
import {
  Text,
  Title,
  Subtitle,
  Heading,
} from '../components/shared/Typography';
import Button from '../components/shared/Button';

const storeMissionsData = async (missions) => {
  await AsyncStorage.setItem('@missions', missions).catch((err) =>
    console.error(err)
  );
};
const getStoredMissionsData = () => {
  return AsyncStorage.getItem('@missions').catch((err) => console.error(err));
};

function CurrentMissions({ loading, missions }) {
  if (loading) {
    return (
      <Placeholder
        Animation={(props) => (
          <Fade {...props} style={{ backgroundColor: Colors.darkGray }} />
        )}
      >
        <PlaceholderLine height={40} style={styles.loader} />
      </Placeholder>
    );
  }

  if (missions) {
    return <Heading>{missions}</Heading>;
  }

  return <Text>Learn more about our global strategic partnerships.</Text>;
}

const MissionsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [missions, setMissions] = useState('');

  useEffect(() => {
    const getMissionsContent = async () => {
      setLoading(true);

      const storedMissionsData = await getStoredMissionsData();

      if (storedMissionsData) {
        setMissions(storedMissionsData);
        setLoading(false);
      }

      // get data from the missions page in WordPress
      const data = await fetch(
        'http://echo.church/wp-json/wp/v2/pages?slug=missions',
        {
          method: 'GET',
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
          },
        }
      ).then((res) => res.json());
      const [{ content: { rendered = '' } = {} } = {}] = data || [];

      if (!rendered && !storedMissionsData) {
        setMissions('');
        setLoading(false);
        Amplitude.logEventWithProperties('ERROR loading missions', { data });
        return;
      }

      // parse the HTML that we get back
      const $ = htmlParser.parse(rendered);

      // get all the headers, which are the different mission trips
      const [, ...headers] = $.querySelectorAll('#global h2');
      const places = headers
        .map(({ childNodes = [] }) => {
          const [{ structuredText: header } = {}] = childNodes;

          return header;
        })
        .join(', ');

      setMissions(places);
      storeMissionsData(places);
      setLoading(false);
    };

    getMissionsContent();
  }, []);

  return (
    <HeaderHeightContext.Consumer>
      {(headerHeight) => (
        <ScrollView
          style={[styles.mainContainer, { paddingTop: headerHeight }]}
        >
          <Image
            source={require('../assets/images/missions.png')}
            style={styles.image}
          />
          <View style={[styles.container, { paddingBottom: headerHeight }]}>
            <Title style={styles.heading}>Echoing Around the World</Title>
            <Text style={styles.content}>
              Mission trips give Echo.Church a chance to serve and encourage our
              partner churches and missionaries around the world, as well as an
              opportunity for our faith to be stretched and our eyes to be
              opened to what God is doing beyond our region.
            </Text>

            <Subtitle>Current mission trips</Subtitle>
            <CurrentMissions loading={loading} missions={missions} />

            <Button
              title="Learn More"
              style={styles.button}
              onPress={() => {
                Amplitude.logEvent('TAP Missions Learn More');
                WebBrowser.openBrowserAsync(
                  'https://echo.church/missions/#global',
                  {
                    toolbarColor: Colors.darkestGray,
                  }
                ).catch((err) => {
                  Amplitude.logEventWithProperties('ERROR with WebBrowser', {
                    error: err,
                  });
                  WebBrowser.dismissBrowser();
                });
              }}
            />
          </View>
        </ScrollView>
      )}
    </HeaderHeightContext.Consumer>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.darkestGray,
  },
  image: {
    width: '100%',
    height: 250,
  },
  container: { paddingVertical: 20, paddingHorizontal: 16 },
  loader: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: Colors.darkestGray,
  },
  heading: {
    marginVertical: 10,
  },
  content: {
    marginBottom: 20,
  },
  button: { marginVertical: 20 },
});

export default MissionsScreen;
