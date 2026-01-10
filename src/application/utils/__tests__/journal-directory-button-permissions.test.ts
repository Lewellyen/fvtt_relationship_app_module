import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canUserSeeJournalDirectoryButtons,
  isBoolean,
} from "../journal-directory-button-permissions";
import type { PlatformSettingsRegistrationPort } from "@/domain/ports/platform-settings-registration-port.interface";
import { SETTING_KEYS } from "@/application/constants/app-constants";
import { MODULE_METADATA } from "@/application/constants/app-constants";
import { ok, err } from "@/domain/utils/result";

describe("isBoolean", () => {
  it("should return true for boolean true", () => {
    expect(isBoolean(true)).toBe(true);
  });

  it("should return true for boolean false", () => {
    expect(isBoolean(false)).toBe(true);
  });

  it("should return false for string", () => {
    expect(isBoolean("true")).toBe(false);
  });

  it("should return false for number", () => {
    expect(isBoolean(1)).toBe(false);
  });

  it("should return false for object", () => {
    expect(isBoolean({})).toBe(false);
  });

  it("should return false for null", () => {
    expect(isBoolean(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(isBoolean(undefined)).toBe(false);
  });

  it("should narrow type correctly", () => {
    const value: unknown = true;
    if (isBoolean(value)) {
      // Type is narrowed to boolean
      const result: boolean = value;
      expect(result).toBe(true);
    }
  });
});

describe("canUserSeeJournalDirectoryButtons", () => {
  let mockSettings: PlatformSettingsRegistrationPort;

  beforeEach(() => {
    mockSettings = {
      registerSetting: vi.fn().mockReturnValue(ok(undefined)),
      getSettingValue: vi.fn().mockReturnValue(ok(true)),
      setSettingValue: vi.fn().mockResolvedValue(ok(undefined)),
    } as unknown as PlatformSettingsRegistrationPort;
  });

  it("should return false if user is undefined", () => {
    const result = canUserSeeJournalDirectoryButtons(mockSettings, undefined);
    expect(result).toBe(false);
    expect(mockSettings.getSettingValue).not.toHaveBeenCalled();
  });

  it("should return false if user.role is undefined", () => {
    const result = canUserSeeJournalDirectoryButtons(mockSettings, {});
    expect(result).toBe(false);
    expect(mockSettings.getSettingValue).not.toHaveBeenCalled();
  });

  it("should return false for unknown role", () => {
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 99 });
    expect(result).toBe(false);
    expect(mockSettings.getSettingValue).not.toHaveBeenCalled();
  });

  it("should return setting value for PLAYER role", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(ok(true));
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 1 });
    expect(result).toBe(true);
    expect(mockSettings.getSettingValue).toHaveBeenCalledWith(
      MODULE_METADATA.ID,
      SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_PLAYER,
      expect.any(Function)
    );
  });

  it("should return setting value for TRUSTED role", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(ok(true));
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 2 });
    expect(result).toBe(true);
    expect(mockSettings.getSettingValue).toHaveBeenCalledWith(
      MODULE_METADATA.ID,
      SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_TRUSTED,
      expect.any(Function)
    );
  });

  it("should return setting value for ASSISTANT role", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(ok(true));
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 3 });
    expect(result).toBe(true);
    expect(mockSettings.getSettingValue).toHaveBeenCalledWith(
      MODULE_METADATA.ID,
      SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_ASSISTANT,
      expect.any(Function)
    );
  });

  it("should return setting value for GAMEMASTER role", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(ok(true));
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 4 });
    expect(result).toBe(true);
    expect(mockSettings.getSettingValue).toHaveBeenCalledWith(
      MODULE_METADATA.ID,
      SETTING_KEYS.JOURNAL_DIRECTORY_BUTTONS_GAMEMASTER,
      expect.any(Function)
    );
  });

  it("should return false if setting read fails", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(
      err({ code: "SETTING_NOT_FOUND", message: "Setting not found" })
    );
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 4 });
    expect(result).toBe(false);
  });

  it("should return false if setting value is false", () => {
    vi.mocked(mockSettings.getSettingValue).mockReturnValue(ok(false));
    const result = canUserSeeJournalDirectoryButtons(mockSettings, { role: 4 });
    expect(result).toBe(false);
  });
});
