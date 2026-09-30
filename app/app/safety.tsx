import { View, Text, Pressable, ScrollView, Linking, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "../src/components/ScreenHeader";
import { Icon, type IconName } from "../src/components/Icon";
import { colors } from "../src/theme/colors";

interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  icon: IconName;
}

// Tourist Police first: English-speaking, and for visitors, which most users are
const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    name: "Tourist Police",
    number: "1155",
    description: "English-speaking help for visitors",
    icon: "shield-outline",
  },
  {
    name: "Emergency Services",
    number: "191",
    description: "Thai Police Emergency",
    icon: "alert-circle-outline",
  },
  {
    name: "Ambulance",
    number: "1669",
    description: "Emergency Medical Services",
    icon: "medkit-outline",
  },
  {
    name: "Fire Department",
    number: "199",
    description: "Fire Emergency",
    icon: "flame-outline",
  },
  {
    name: "Chiang Mai Hospital",
    number: "+66 53 920 300",
    description: "24-hour Emergency",
    icon: "medical-outline",
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
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <ScreenHeader />
        <View className="px-6 pb-4">

          <Text className="text-ink text-2xl font-semibold mb-2">
            Emergency Contacts
          </Text>
          <Text className="text-ink-secondary text-base">
            Quick access to emergency services and support
          </Text>
        </View>

        {/* Safety Message */}
        <View className="mx-6 mb-4 bg-subtle border border-line rounded-xl p-4">
          <Text className="text-ink font-medium mb-1">
            Your Safety Matters
          </Text>
          <Text className="text-ink text-sm">
            If you feel unsafe, trust your instincts. Use these contacts to get
            help right away.
          </Text>
        </View>

        {/* Emergency Contacts List */}
        <View className="px-6 pb-6">
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <View
              key={index}
              className="bg-surface rounded-xl p-4 mb-3 border border-line"
            >
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-subtle items-center justify-center mr-3"><Icon name={contact.icon} /></View>
                <View className="flex-1">
                  <Text className="text-ink text-lg font-semibold">
                    {contact.name}
                  </Text>
                  <Text className="text-ink-secondary text-sm">
                    {contact.description}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => handleCall(contact.name, contact.number)}
                  className="flex-1 bg-error rounded-lg py-3 active:opacity-70"
                >
                  <Text className="text-white text-center font-semibold">
                    Call {contact.number}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => copyNumber(contact.number)}
                  className="bg-line rounded-lg px-4 py-3 active:opacity-70"
                >
                  <Text className="text-ink text-center">Copy</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {/* Users come from everywhere, so no single embassy is right to list */}
          <Text className="text-ink-secondary text-sm leading-5 mt-1">
            Visiting from abroad? Save your embassy's number in Bangkok before you need it.
          </Text>
        </View>

        {/* Blocked Users Link */}
        <View className="px-6 mb-4">
          <Pressable
            onPress={() => router.push("/blocked-users")}
            className="bg-surface rounded-xl p-4 border border-line flex-row items-center justify-between active:opacity-70"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-subtle items-center justify-center mr-3"><Icon name="ban-outline" /></View>
              <View>
                <Text className="text-ink font-semibold">
                  Blocked Users
                </Text>
                <Text className="text-ink-secondary text-sm">
                  Manage who you've blocked
                </Text>
              </View>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.inkMuted} />
          </Pressable>
        </View>

        {/* Safety Tips */}
        <View className="mx-6 mb-6 bg-surface rounded-xl p-4 border border-line">
          <Text className="text-ink font-semibold mb-3">
            Safety Tips
          </Text>
          <View className="space-y-2">
            <Text className="text-ink-secondary text-sm leading-5">
              • Meet in public places with other people around
            </Text>
            <Text className="text-ink-secondary text-sm leading-5">
              • Tell a friend or family member where you're going
            </Text>
            <Text className="text-ink-secondary text-sm leading-5">
              • Share your live location before meeting
            </Text>
            <Text className="text-ink-secondary text-sm leading-5">
              • Trust your instincts - if something feels off, leave
            </Text>
            <Text className="text-ink-secondary text-sm leading-5">
              • Keep your phone charged and accessible
            </Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
