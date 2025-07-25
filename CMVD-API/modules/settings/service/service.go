package service

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"api/modules/settings/domain"
	"github.com/joho/godotenv"
)

type SettingsServiceImpl struct{}

func NewSettingsService() *SettingsServiceImpl {
	return &SettingsServiceImpl{}
}

func (s *SettingsServiceImpl) GetAllSettings(tokenClaims interface{}) (*domain.Settings, error) {
	envFile := getEnvFile()
	err := godotenv.Load(envFile)
	if err != nil {
		return nil, errors.New("error al cargar el archivo de configuración: " + err.Error())
	}

	settings, err := domain.LoadSettings()
	if err != nil {
		return nil, err
	}

	return settings, nil
}

func (s *SettingsServiceImpl) UpdateSettings(settings domain.SettingsUpdate, tokenClaims interface{}) (*domain.Settings, error) {
	envFile := getEnvFile()

	err := godotenv.Load(envFile)
	if err != nil {
		return nil, errors.New("error al cargar el archivo de configuración: " + err.Error())
	}

	file, err := os.Open(envFile)
	if err != nil {
		return nil, errors.New("error al abrir el archivo de configuración: " + err.Error())
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		return nil, errors.New("error al leer el archivo de configuración: " + err.Error())
	}

	updateMap := map[string]string{
		"SMTP_HOST":                    settings.SMTPHost,
		"SMTP_PORT":                    strconv.Itoa(settings.SMTPPort),
		"SMTP_USER":                    settings.SMTPUser,
		"SMTP_PASSWORD":                settings.SMTPPassword,
		"SMTP_FROM":                    settings.SMTPFrom,
		"SHOULD_NOTIFY_DRIVER":         strconv.FormatBool(settings.ShouldNotifyDriver),
		"SHIPMENTS_ENABLED":            strconv.FormatBool(settings.ShipmentsEnabled),
		"MAX_DAILY_SHIPMENTS_MONDAY":   strconv.Itoa(settings.MaxDailyShipmentsMonday),
		"MAX_DAILY_SHIPMENTS_TUESDAY":  strconv.Itoa(settings.MaxDailyShipmentsTuesday),
		"MAX_DAILY_SHIPMENTS_WEDNESDAY":strconv.Itoa(settings.MaxDailyShipmentsWednesday),
		"MAX_DAILY_SHIPMENTS_THURSDAY": strconv.Itoa(settings.MaxDailyShipmentsThursday),
		"MAX_DAILY_SHIPMENTS_FRIDAY":   strconv.Itoa(settings.MaxDailyShipmentsFriday),
		"MAX_DAILY_SHIPMENTS_SATURDAY": strconv.Itoa(settings.MaxDailyShipmentsSaturday),
		"MAX_DAILY_SHIPMENTS_SUNDAY":   strconv.Itoa(settings.MaxDailyShipmentsSunday),
	}

	for i, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		if strings.HasPrefix(trimmedLine, "#") || trimmedLine == "" {
			continue
		}

		parts := strings.SplitN(trimmedLine, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		if newValue, exists := updateMap[key]; exists && newValue != "" {
			lines[i] = fmt.Sprintf("%s=%s", key, newValue)
			os.Setenv(key, newValue)
			delete(updateMap, key)
		}
	}

	for key, value := range updateMap {
		if value != "" {
			lines = append(lines, fmt.Sprintf("%s=%s", key, value))
			os.Setenv(key, value)
		}
	}

	err = os.WriteFile(envFile, []byte(strings.Join(lines, "\n")+"\n"), 0644)
	if err != nil {
		return nil, errors.New("error al actualizar el archivo de configuración: " + err.Error())
	}

	finalSettings, err := domain.LoadSettings()
	if err != nil {
		return nil, err
	}

	return finalSettings, nil
}

func getEnvFile() string {
	if os.Getenv("APP_ENV") == "production" {
		return ".env.production"
	}
	return ".env"
}
