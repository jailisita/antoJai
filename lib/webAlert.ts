// En web, Alert.alert de React Native no hace nada, así que los errores y las
// confirmaciones (ej: eliminar categoría) pasaban en silencio. Este parche lo
// reemplaza por window.alert / window.confirm. En móvil no cambia nada.
import { Alert, AlertButton, Platform } from 'react-native';

if (Platform.OS === 'web') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = message ? `${title}\n\n${message}` : title;
    const actions = buttons ?? [];
    const cancel = actions.find((b) => b.style === 'cancel');
    const others = actions.filter((b) => b !== cancel);

    if (others.length <= 1 && (!cancel || others.length === 0)) {
      // Solo informativo (o un único botón): alert simple.
      window.alert(text);
      (others[0] ?? actions[0])?.onPress?.();
      return;
    }

    // Confirmación: OK ejecuta la primera acción no-cancel, Cancelar la de cancelar.
    if (window.confirm(text)) others[0]?.onPress?.();
    else cancel?.onPress?.();
  };
}
