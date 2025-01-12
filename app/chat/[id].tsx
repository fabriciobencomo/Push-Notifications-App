import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import { ThemedText } from '@/components/ThemedText'

const ChatIdScreen = () => {
  const {id} = useLocalSearchParams()

  return (
    <View style={{marginHorizontal: 10, }}>
      <ThemedText style={{fontSize: 25, marginBottom: 10}}>Chat Screen</ThemedText>
      <ThemedText style={{fontSize: 25, marginBottom: 10}}>Chat ID: {id}</ThemedText>
    </View>
  )
}

export default ChatIdScreen