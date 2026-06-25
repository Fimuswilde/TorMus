import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { PlayerProvider } from './context/PlayerContext';
import SearchScreen from './screens/SearchScreen';
import TorrentScreen from './screens/TorrentScreen';
import PlayerScreen from './screens/PlayerScreen';
import PlayerBar from './components/PlayerBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              'Поиск': focused ? 'search' : 'search-outline',
              'Загрузки': focused ? 'download' : 'download-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#1DB954',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: { backgroundColor: '#181818', borderTopColor: '#282828' },
        })}
      >
        <Tab.Screen name="Поиск" component={SearchScreen} />
        <Tab.Screen name="Загрузки" component={TorrentScreen} />
      </Tab.Navigator>
      <PlayerBar />
    </View>
  );
}

const theme = {
  dark: true,
  colors: {
    primary: '#1DB954',
    background: '#121212',
    card: '#181818',
    text: '#ffffff',
    border: '#282828',
    notification: '#1DB954',
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PlayerProvider>
          <NavigationContainer theme={theme}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen
                name="Player"
                component={PlayerScreen}
                options={{ presentation: 'modal' }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </PlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
