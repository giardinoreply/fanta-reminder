import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { sectionStyles } from "./sharedStyles";
import { colors, spacing } from "../../common/theme/tokens";
import { ALLOWED_MODULI, type FantaLineupPlayer, type FantaRole } from "../../services/fantaLineupBackend";

type LineupAssignment = "none" | "starter" | "bench";

type LineupSectionProps = {
  username: string;
  password: string;
  idSquadra: string;
  idComp: string;
  division: string;
  modulo: (typeof ALLOWED_MODULI)[number];
  playersByRole: Record<FantaRole, FantaLineupPlayer[]>;
  assignments: Record<string, LineupAssignment>;
  lineupState: string;
  lineupBusy: boolean;
  lineupLocked: boolean;
  lineupDayState: "unknown" | "open" | "locked";
  lineupFetchError: string;
  isFetchDisabled: boolean;
  validation: {
    canSubmit: boolean;
    startersCount: number;
    benchCount: number;
    required: { P: number; D: number; C: number; A: number };
    roleCounts: Record<FantaRole, number>;
  };
  onChangeUsername: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangeIdSquadra: (value: string) => void;
  onChangeIdComp: (value: string) => void;
  onChangeDivision: (value: string) => void;
  onChangeModulo: (value: (typeof ALLOWED_MODULI)[number]) => void;
  onSetAssignment: (playerName: string, assignment: LineupAssignment) => void;
  onFetchStatus: () => void;
  onSuggestLineup: () => void;
  onSubmitLineup: () => void;
};

const ROLE_LABELS: Record<FantaRole, string> = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti",
  "?": "Altro",
};

function getPercentStyle(percent: number | undefined) {
  if (typeof percent !== "number") {
    return styles.percentNeutral;
  }
  if (percent >= 90) {
    return styles.percentGood;
  }
  if (percent >= 30 && percent <= 80) {
    return styles.percentWarn;
  }
  if (percent <= 20) {
    return styles.percentBad;
  }
  return styles.percentNeutral;
}

function PlayerRow({
  player,
  assignment,
  lineupLocked,
  onSetAssignment,
}: {
  player: FantaLineupPlayer;
  assignment: LineupAssignment;
  lineupLocked: boolean;
  onSetAssignment: (playerName: string, next: LineupAssignment) => void;
}) {
  const unavailable = player.status !== undefined && player.status !== 1;
  const isDisabled = unavailable || lineupLocked;
  const hasMatch = Boolean(player.teamH && player.teamA);

  return (
    <View style={styles.playerRow}>
      <View style={styles.playerInfo}>
        <Text style={styles.playerName}>
          {player.plyr} ({player.tname ?? "N/D"}) {unavailable ? "(IND)" : ""}
        </Text>
        {hasMatch && (
          <Text style={styles.playerMeta}>
            {player.teamH} - {player.teamA}
            {player.percent !== undefined ? " - " : ""}
            {player.percent !== undefined && (
              <Text style={[styles.playerPercent, getPercentStyle(player.percent)]}>{player.percent}%</Text>
            )}
          </Text>
        )}
        {!hasMatch && player.percent !== undefined && (
          <Text style={styles.playerMeta}>
            <Text style={[styles.playerPercent, getPercentStyle(player.percent)]}>{player.percent}%</Text>
          </Text>
        )}
      </View>
      <View style={styles.playerActions}>
        <Pressable
          onPress={() => onSetAssignment(player.plyr, "starter")}
          disabled={isDisabled}
          style={[styles.tagButton, assignment === "starter" && styles.tagButtonPrimary, isDisabled && styles.tagDisabled]}
        >
          <Text style={[styles.tagText, assignment === "starter" && styles.tagTextPrimary]}>T</Text>
        </Pressable>
        <Pressable
          onPress={() => onSetAssignment(player.plyr, "bench")}
          disabled={lineupLocked}
          style={[styles.tagButton, assignment === "bench" && styles.tagButtonBench, lineupLocked && styles.tagDisabled]}
        >
          <Text style={styles.tagText}>P</Text>
        </Pressable>
        <Pressable
          onPress={() => onSetAssignment(player.plyr, "none")}
          disabled={lineupLocked}
          style={[styles.tagButton, assignment === "none" && styles.tagButtonNeutral, lineupLocked && styles.tagDisabled]}
        >
          <Text style={styles.tagText}>-</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function LineupSection({
  username,
  password,
  idSquadra,
  idComp,
  division,
  modulo,
  playersByRole,
  assignments,
  lineupState,
  lineupBusy,
  lineupLocked,
  lineupDayState,
  lineupFetchError,
  isFetchDisabled,
  validation,
  onChangeUsername,
  onChangePassword,
  onChangeIdSquadra,
  onChangeIdComp,
  onChangeDivision,
  onChangeModulo,
  onSetAssignment,
  onFetchStatus,
  onSuggestLineup,
  onSubmitLineup,
}: LineupSectionProps) {
  const hasPlayers = playersByRole.P.length + playersByRole.D.length + playersByRole.C.length + playersByRole.A.length > 0;

  return (
    <View style={sectionStyles.card}>
      <Text style={styles.kicker}>LINEUP ENGINE</Text>
      <Text style={sectionStyles.sectionTitle}>Gestione formazione</Text>
      <Text style={sectionStyles.label}>Inserisci le seguenti informazioni</Text>

      <Text style={sectionStyles.label}>Username fantacalcio</Text>
      <TextInput
        value={username}
        onChangeText={onChangeUsername}
        autoCapitalize="none"
        autoCorrect={false}
        style={sectionStyles.input}
        placeholder="utente fantacalcio"
        placeholderTextColor={colors.textMuted}
      />

      <Text style={sectionStyles.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={onChangePassword}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        style={sectionStyles.input}
        placeholder="password fantacalcio"
        placeholderTextColor={colors.textMuted}
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={sectionStyles.label}>Id squadra</Text>
          <TextInput
            value={idSquadra}
            onChangeText={onChangeIdSquadra}
            keyboardType="number-pad"
            style={sectionStyles.input}
            placeholder="123456"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={styles.col}>
          <Text style={sectionStyles.label}>Id competizione</Text>
          <TextInput
            value={idComp}
            onChangeText={onChangeIdComp}
            keyboardType="number-pad"
            style={sectionStyles.input}
            placeholder="700001"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>

      <Text style={sectionStyles.label}>Divisione</Text>
      <TextInput
        value={division}
        onChangeText={onChangeDivision}
        autoCapitalize="characters"
        style={sectionStyles.input}
        placeholder="A"
        placeholderTextColor={colors.textMuted}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={onFetchStatus}
          disabled={lineupBusy || isFetchDisabled}
          style={[sectionStyles.secondaryButton, (lineupBusy || isFetchDisabled) && styles.disabled]}
        >
          <Text style={sectionStyles.secondaryText}>RECUPERA INFO FORMAZIONE</Text>
        </Pressable>
      </View>
      {lineupFetchError.length > 0 && <Text style={styles.fetchError}>{lineupFetchError}</Text>}

      {hasPlayers && (
        <View style={styles.editorWrap}>
          <Text style={styles.editorTitle}>Composizione formazione</Text>
          {lineupDayState === "open" && (
            <View style={styles.openPill}>
              <Text style={styles.openPillText}>Giornata aperta</Text>
            </View>
          )}
          {lineupDayState === "locked" && (
            <View style={styles.lockPill}>
              <Text style={styles.lockPillText}>Giornata bloccata</Text>
            </View>
          )}

          <View style={styles.moduloWrap}>
            {ALLOWED_MODULI.map((item) => (
              <Pressable
                key={item}
                onPress={() => onChangeModulo(item)}
                disabled={lineupLocked}
                style={[styles.moduloChip, modulo === item && styles.moduloChipActive, lineupLocked && styles.disabled]}
              >
                <Text style={[styles.moduloChipText, modulo === item && styles.moduloChipTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>
              Titolari {validation.startersCount}/11 - Panchina {validation.benchCount}/12
            </Text>
            <Text style={styles.summaryText}>
              Ruoli: P {validation.roleCounts.P}/{validation.required.P} - D {validation.roleCounts.D}/{validation.required.D} - C {validation.roleCounts.C}/{validation.required.C} - A {validation.roleCounts.A}/{validation.required.A}
            </Text>
          </View>

          {(["P", "D", "C", "A"] as const).map((role) => (
            <View key={role} style={styles.roleBlock}>
              <Text style={styles.roleTitle}>{ROLE_LABELS[role]}</Text>
              {playersByRole[role].map((player) => (
                <PlayerRow
                  key={player.pid ?? player.plyr}
                  player={player}
                  assignment={assignments[player.plyr] ?? "none"}
                  lineupLocked={lineupLocked}
                  onSetAssignment={onSetAssignment}
                />
              ))}
            </View>
          ))}

          <View style={styles.actions}>
            <Pressable
              onPress={onSuggestLineup}
              disabled={lineupBusy || lineupLocked}
              style={[sectionStyles.secondaryButton, (lineupBusy || lineupLocked) && styles.disabled]}
            >
              <Text style={sectionStyles.secondaryText}>PROPONI FORMAZIONE</Text>
            </Pressable>
            <Pressable
              onPress={onSubmitLineup}
              disabled={lineupBusy || !validation.canSubmit}
              style={[sectionStyles.primaryButton, (lineupBusy || !validation.canSubmit) && styles.disabled]}
            >
              <Text style={sectionStyles.primaryText}>INVIA FORMAZIONE</Text>
            </Pressable>
          </View>
        </View>
      )}

      {lineupState.length > 0 && (
        <View style={sectionStyles.statePill}>
          <Text style={sectionStyles.statePillText}>{lineupState}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.nerazzurro,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  col: {
    flex: 1,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.5,
  },
  fetchError: {
    color: colors.errorText,
    fontWeight: "700",
    backgroundColor: colors.errorBg,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  lockPill: {
    borderWidth: 1,
    borderColor: colors.biancorossoSoft,
    backgroundColor: "#351524",
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  lockPillText: {
    color: colors.errorText,
    fontWeight: "700",
    fontSize: 12,
  },
  openPill: {
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "#122b1f",
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  openPillText: {
    color: colors.success,
    fontWeight: "700",
    fontSize: 12,
  },
  editorWrap: {
    marginTop: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.bgAlt,
  },
  editorTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  moduloWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moduloChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surfaceSoft,
  },
  moduloChipActive: {
    borderColor: colors.nerazzurroSoft,
    backgroundColor: colors.nerazzurro,
  },
  moduloChipText: {
    color: colors.textSecondary,
    fontWeight: "700",
    fontSize: 12,
  },
  moduloChipTextActive: {
    color: colors.white,
  },
  summaryBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.sm,
    backgroundColor: colors.surfaceSoft,
    gap: 4,
  },
  summaryText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 12,
  },
  roleBlock: {
    gap: spacing.xs,
  },
  roleTitle: {
    color: colors.nerazzurro,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  playerInfo: {
    flex: 1,
    gap: 2,
  },
  playerName: {
    color: colors.textPrimary,
    fontWeight: "700",
    fontSize: 13,
  },
  playerMeta: {
    color: colors.textMuted,
    fontWeight: "600",
    fontSize: 11,
  },
  playerPercent: {
    fontWeight: "600",
  },
  percentGood: {
    color: colors.success,
  },
  percentWarn: {
    color: "#f5c451",
  },
  percentBad: {
    color: colors.biancorosso,
  },
  percentNeutral: {
    color: colors.textMuted,
  },
  playerActions: {
    flexDirection: "row",
    gap: 6,
  },
  tagButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    minWidth: 30,
    paddingVertical: 5,
    alignItems: "center",
    backgroundColor: colors.surfaceSoft,
  },
  tagButtonPrimary: {
    borderColor: colors.nerazzurroSoft,
    backgroundColor: colors.nerazzurro,
  },
  tagButtonBench: {
    borderColor: colors.biancorossoSoft,
    backgroundColor: "#351524",
  },
  tagButtonNeutral: {
    borderColor: colors.border,
    backgroundColor: colors.bgAlt,
  },
  tagDisabled: {
    opacity: 0.45,
  },
  tagText: {
    color: colors.textPrimary,
    fontWeight: "800",
    fontSize: 11,
  },
  tagTextPrimary: {
    color: colors.white,
  },
});
