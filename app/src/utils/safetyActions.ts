import { Alert } from "react-native";
import type { useRouter } from "expo-router";
import { useBlockStore } from "../stores/blockStore";

type Person = { userId: string; name: string; momentId?: string };
type Router = ReturnType<typeof useRouter>;

/** Confirms, then blocks. Shared by the action sheet and the post-report prompt. */
export function confirmBlock({ userId, name }: Person, onBlocked?: () => void) {
  Alert.alert(`Block ${name}?`, "You can unblock them in Settings.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Block",
      style: "destructive",
      onPress: async () => {
        const blocked = await useBlockStore.getState().blockUser(userId);
        if (blocked) {
          onBlocked?.();
        } else {
          Alert.alert("Couldn't block", "Check your connection and try again.");
        }
      },
    },
  ]);
}

/**
 * "Report or block" for someone the user shares a meal with. Report and block
 * must be reachable from where people actually meet (App Store guideline 1.2),
 * not only from the Safety screen.
 */
export function openSafetyActions(router: Router, person: Person) {
  Alert.alert(person.name, undefined, [
    {
      text: `Report ${person.name}`,
      onPress: () => {
        const params = [
          `userId=${encodeURIComponent(person.userId)}`,
          `userName=${encodeURIComponent(person.name)}`,
          ...(person.momentId ? [`momentId=${encodeURIComponent(person.momentId)}`] : []),
        ];
        router.push(`/report-user?${params.join("&")}`);
      },
    },
    { text: `Block ${person.name}`, style: "destructive", onPress: () => confirmBlock(person) },
    { text: "Cancel", style: "cancel" },
  ]);
}
