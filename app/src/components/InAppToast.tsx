import { View, Text, Animated, Pressable } from "react-native";
import { useEffect, useRef } from "react";
import { useNotificationStore, InAppNotification } from "../stores/notificationStore";

export function InAppToast() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore((state) => state.removeNotification);

  // Only show the most recent unread notification
  const activeNotification = notifications.find((n) => !n.read);

  if (!activeNotification) return null;

  return (
    <ToastItem
      key={activeNotification.id}
      notification={activeNotification}
      onDismiss={() => removeNotification(activeNotification.id)}
    />
  );
}

interface ToastItemProps {
  notification: InAppNotification;
  onDismiss: () => void;
}

function ToastItem({ notification, onDismiss }: ToastItemProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      dismissToast();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getIconForType = (type: InAppNotification["type"]) => {
    switch (type) {
      case "guest_joined":
        return "+1";
      case "guest_cancelled":
        return "-1";
      default:
        return "i";
    }
  };

  const getBackgroundColor = (type: InAppNotification["type"]) => {
    switch (type) {
      case "guest_joined":
        return "#22C55E"; // success green
      case "guest_cancelled":
        return "#F97316"; // orange
      default:
        return "#1C1917"; // dark
    }
  };

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Pressable onPress={dismissToast}>
        <View
          style={{
            backgroundColor: getBackgroundColor(notification.type),
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          {/* Icon circle */}
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: "white", fontSize: 14, fontWeight: "600" }}>
              {getIconForType(notification.type)}
            </Text>
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "white",
                fontSize: 15,
                fontWeight: "600",
                marginBottom: 2,
              }}
            >
              {notification.title}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
              {notification.message}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
