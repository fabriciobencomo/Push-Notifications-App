import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { routeToScreen } from 'expo-router/build/useScreens';
import { router } from 'expo-router';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface SendPushOptins {
  to: string[];
  title: string;
  body: string;
  data?: Record<string, any>
}

async function sendPushNotification(options: SendPushOptins) {

  const {to, title, body, data} = options

  const message = {
    to: to,
    sound: 'default',
    title: title,
    body: body,
    data: data
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}

function handleRegistrationError(errorMessage: string) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      handleRegistrationError('Permission not granted to get push token for push notification!');
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log({[Platform.OS]: pushTokenString});
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

let areListenersReady = false

export const usePushNotifications = () => {

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notifications, setNotifications] = useState<Notifications.Notification[]>([]);
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    if(areListenersReady) return 
    registerForPushNotificationsAsync()
      .then(token => setExpoPushToken(token ?? ''))
      .catch((error: any) => setExpoPushToken(`${error}`));
  }, [])

  useEffect(() => {

    if(areListenersReady) return 

    areListenersReady = true

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotifications((previousNotifications) => [notification, ...previousNotifications]);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { chatID } = response.notification.request.content.data;

      if (chatID){
        router.push(`/chat/${chatID}`);
      }
    });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(notificationListener.current);
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, [])
  
  

  return {
    expoPushToken,
    notifications,

    sendPushNotification
  }
}

