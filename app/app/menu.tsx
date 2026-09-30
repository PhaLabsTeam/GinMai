import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useAuthStore } from "../src/stores/authStore";
import { useMomentStore } from "../src/stores/momentStore";
import { colors } from "../src/theme/colors";
import { Icon } from "../src/components/Icon";

export default function MenuScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const fetchMyActiveMoment = useMomentStore((state) => state.fetchMyActiveMoment);
  const [findingMoment, setFindingMoment] = useState(false);
  const [noActiveMoment, setNoActiveMoment] = useState(false);

  const handleClose = () => {
    router.back();
  };

  const handleMyMoments = async () => {
    if (!user) {
      router.push("/sign-up?returnTo=/menu");
      return;
    }
    if (findingMoment) return;

    setFindingMoment(true);
    setNoActiveMoment(false);
    const active = await fetchMyActiveMoment(user.id);
    setFindingMoment(false);

    if (!active) {
      setNoActiveMoment(true);
    } else if (active.role === "host") {
      router.push(`/moment-live?momentId=${active.moment.id}`);
    } else {
      router.push(`/confirmation?momentId=${active.moment.id}`);
    }
  };

  const handleSafety = () => {
    router.push("/safety");
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
      <Text className="text-[17px] text-ink ml-3">{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-[17px] font-medium text-ink">Menu</Text>
        <Pressable
          onPress={handleClose}
          accessibilityLabel="Close menu"
          className="w-10 h-10 items-center justify-center"
        >
          <Icon name="close" size={26} />
        </Pressable>
      </View>

      {/* Divider */}
      <View className="h-px bg-subtle" />

      {/* Menu items */}
      <View className="px-6 pt-4">
        <MenuItem
          icon={<Icon name="restaurant-outline" />}
          label="My Moments"
          onPress={handleMyMoments}
        />
        {findingMoment && (
          <ActivityIndicator size="small" color={colors.inkSecondary} style={{ alignSelf: "flex-start", marginLeft: 44 }} />
        )}
        {noActiveMoment && (
          <Text className="text-[14px] text-ink-secondary ml-11 -mt-2 mb-2">
            Nothing planned right now.
          </Text>
        )}
        <MenuItem
          icon={<Icon name="person-circle-outline" />}
          label="Profile"
          onPress={handleProfile}
        />
        <MenuItem
          icon={<Icon name="settings-outline" />}
          label="Settings"
          onPress={handleSettings}
        />
        <MenuItem
          icon={<Icon name="shield-outline" />}
          label="Safety"
          onPress={handleSafety}
        />
      </View>

      {/* Divider */}
      <View className="h-px bg-subtle mt-4" />

      {/* Version info */}
      <View className="py-6">
        <Text className="text-center text-[14px] text-ink-muted">
          GinMai · Version 1.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
