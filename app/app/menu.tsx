import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MenuScreen() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  const handleMyMoments = () => {
    // Navigate to my moments / moment-live if active
    router.push("/map");
  };

  const handleSafety = () => {
    // Navigate to safety screen (not yet implemented)
    router.back();
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleProfile = () => {
    router.push("/profile");
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 active:opacity-60"
    >
      <View className="w-8 items-center">{icon}</View>
      <Text className="text-[17px] text-[#1C1917] ml-3">{label}</Text>
    </Pressable>
  );

  // Location pin icon
  const LocationIcon = () => (
    <View className="w-5 h-5 items-center justify-center">
      <View className="w-4 h-5 border-2 border-[#1C1917] rounded-full rounded-b-none items-center pt-0.5">
        <View className="w-1.5 h-1.5 bg-[#1C1917] rounded-full" />
      </View>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 4,
          borderRightWidth: 4,
          borderTopWidth: 5,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#1C1917",
          marginTop: -1,
        }}
      />
    </View>
  );

  // Shield icon
  const ShieldIcon = () => (
    <View className="w-5 h-6 border-2 border-[#1C1917] rounded-t-lg rounded-b-full" />
  );

  // Settings/gear icon
  const SettingsIcon = () => (
    <View className="w-5 h-5 border-2 border-[#1C1917] rounded-full items-center justify-center">
      <View className="w-1.5 h-1.5 bg-[#1C1917] rounded-full" />
    </View>
  );

  // Profile icon
  const ProfileIcon = () => (
    <View className="w-5 h-5 rounded-full border-2 border-[#1C1917] items-center overflow-hidden">
      <View className="w-1.5 h-1.5 bg-[#1C1917] rounded-full mt-0.5" />
      <View className="w-3.5 h-1.5 bg-[#1C1917] rounded-t-full mt-0.5" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAF9]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-[17px] font-medium text-[#1C1917]">Menu</Text>
        <Pressable
          onPress={handleClose}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[24px] text-[#1C1917]">×</Text>
        </Pressable>
      </View>

      {/* Divider */}
      <View className="h-px bg-[#F3F4F6]" />

      {/* Menu items */}
      <View className="px-6 pt-4">
        <MenuItem
          icon={<LocationIcon />}
          label="My Moments"
          onPress={handleMyMoments}
        />
        <MenuItem
          icon={<ProfileIcon />}
          label="Profile"
          onPress={handleProfile}
        />
        <MenuItem
          icon={<SettingsIcon />}
          label="Settings"
          onPress={handleSettings}
        />
        <MenuItem
          icon={<ShieldIcon />}
          label="Safety"
          onPress={handleSafety}
        />
      </View>

      {/* Divider */}
      <View className="h-px bg-[#F3F4F6] mt-4" />

      {/* Version info */}
      <View className="py-6">
        <Text className="text-center text-[14px] text-[#9CA3AF]">
          GinMai · Version 1.0
        </Text>
      </View>

      {/* Floating action button */}
      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={() => router.replace("/map")}
          className="w-14 h-14 bg-[#1F2937] rounded-full items-center justify-center active:opacity-80 shadow-lg"
        >
          <Text className="text-white text-2xl font-light">›</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
