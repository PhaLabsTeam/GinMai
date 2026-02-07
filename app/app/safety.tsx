import { View, Text, Pressable, ScrollView, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  icon: string;
}

const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: "Emergency Services",
    number: "191",
    description: "Thai Police Emergency",
    icon: "🚨",
  },
  {
    name: "Ambulance",
    number: "1669",
    description: "Emergency Medical Services",
    icon: "🏥",
  },
  {
    name: "Fire Department",
    number: "199",
    description: "Fire Emergency",
    icon: "🚒",
  },
  {
    name: "Chiang Mai Hospital",
    number: "+66 53 920 300",
    description: "24-hour Emergency",
    icon: "🏥",
  },
  {
    name: "US Embassy",
    number: "+66 2 205 4000",
    description: "American Citizen Services",
    icon: "🇺🇸",
  },
  {
    name: "Tourist Police",
    number: "1155",
    description: "Tourism-related assistance",
    icon: "👮",
  },
];

export default function SafetyScreen() {
  const router = useRouter();

  const handleCall = (name: string, number: string) => {
    Alert.alert(
      `Call ${name}?`,
      `Dial ${number}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          style: "default",
          onPress: () => {
            const phoneUrl = `tel:${number.replace(/[^0-9+]/g, "")}`;
            Linking.openURL(phoneUrl).catch((err) => {
              console.error("Error opening phone app:", err);
              Alert.alert("Error", "Could not open phone app");
            });
          },
        },
      ]
    );
  };

  const copyNumber = (number: string) => {
    // Note: Clipboard API would be used here in a real implementation
    Alert.alert("Copied", `${number} copied to clipboard`);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <Pressable onPress={() => router.back()} className="mb-4">
            <Text className="text-[#F97316] text-base">← Back</Text>
          </Pressable>

          <Text className="text-[#1C1917] text-2xl font-semibold mb-2">
            Emergency Contacts
          </Text>
          <Text className="text-[#78716C] text-base">
            Quick access to emergency services and support
          </Text>
        </View>

        {/* Safety Message */}
        <View className="mx-6 mb-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-xl p-4">
          <Text className="text-[#92400E] font-medium mb-1">
            Your Safety Matters
          </Text>
          <Text className="text-[#92400E] text-sm">
            If you feel unsafe, trust your instincts. Use these contacts to get
            help immediately. You can also share your location with a trusted contact.
          </Text>
        </View>

        {/* Emergency Contacts List */}
        <View className="px-6 pb-6">
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <View
              key={index}
              className="bg-white rounded-xl p-4 mb-3 border border-[#E7E5E4]"
            >
              <View className="flex-row items-center mb-2">
                <Text className="text-3xl mr-3">{contact.icon}</Text>
                <View className="flex-1">
                  <Text className="text-[#1C1917] text-lg font-semibold">
                    {contact.name}
                  </Text>
                  <Text className="text-[#78716C] text-sm">
                    {contact.description}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => handleCall(contact.name, contact.number)}
                  className="flex-1 bg-[#EF4444] rounded-lg py-3 active:opacity-70"
                >
                  <Text className="text-white text-center font-semibold">
                    Call {contact.number}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => copyNumber(contact.number)}
                  className="bg-[#E7E5E4] rounded-lg px-4 py-3 active:opacity-70"
                >
                  <Text className="text-[#1C1917] text-center">Copy</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {/* Safety Tips */}
        <View className="mx-6 mb-6 bg-white rounded-xl p-4 border border-[#E7E5E4]">
          <Text className="text-[#1C1917] font-semibold mb-3">
            Safety Tips
          </Text>
          <View className="space-y-2">
            <Text className="text-[#78716C] text-sm leading-5">
              • Meet in public places with other people around
            </Text>
            <Text className="text-[#78716C] text-sm leading-5">
              • Tell a friend or family member where you're going
            </Text>
            <Text className="text-[#78716C] text-sm leading-5">
              • Share your live location before meeting
            </Text>
            <Text className="text-[#78716C] text-sm leading-5">
              • Trust your instincts - if something feels off, leave
            </Text>
            <Text className="text-[#78716C] text-sm leading-5">
              • Keep your phone charged and accessible
            </Text>
          </View>
        </View>

        {/* Report Inappropriate Behavior */}
        <View className="mx-6 mb-8">
          <Pressable
            onPress={() => router.push("/report-user?userId=test-user&userName=Test User")}
            className="bg-[#F97316] rounded-xl py-4 active:opacity-80"
          >
            <Text className="text-white text-center font-semibold">
              Report Inappropriate Behavior
            </Text>
          </Pressable>
          <Text className="text-[#78716C] text-xs text-center mt-2">
            For testing - in production, this appears on user profiles
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
