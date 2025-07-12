package domain

import (
	"os"
	"strconv"
)

type Settings struct {
	Port                      string `json:"port"`
	AppEnv                    string `json:"app_env"`
	SMTPHost                  string `json:"smtp_host"`
	SMTPPort                  int    `json:"smtp_port"`
	SMTPUser                  string `json:"smtp_user"`
	SMTPPassword              string `json:"smtp_password"`
	SMTPFrom                  string `json:"smtp_from"`
	ShouldNotifyDriver        bool   `json:"should_notify_driver"`
	ShipmentsEnabled          bool   `json:"shipments_enabled"`
	MaxDailyShipmentsMonday    int    `json:"max_daily_shipments_monday"`
	MaxDailyShipmentsTuesday   int    `json:"max_daily_shipments_tuesday"`
	MaxDailyShipmentsWednesday int    `json:"max_daily_shipments_wednesday"`
	MaxDailyShipmentsThursday  int    `json:"max_daily_shipments_thursday"`
	MaxDailyShipmentsFriday    int    `json:"max_daily_shipments_friday"`
	MaxDailyShipmentsSaturday  int    `json:"max_daily_shipments_saturday"`
	MaxDailyShipmentsSunday    int    `json:"max_daily_shipments_sunday"`
}

type SettingsUpdate struct {
	SMTPHost                  string `json:"smtp_host"`
	SMTPPort                  int    `json:"smtp_port"`
	SMTPUser                  string `json:"smtp_user"`
	SMTPPassword              string `json:"smtp_password"`
	SMTPFrom                  string `json:"smtp_from"`
	ShouldNotifyDriver        bool   `json:"should_notify_driver"`
	ShipmentsEnabled          bool   `json:"shipments_enabled"`
	MaxDailyShipmentsMonday    int    `json:"max_daily_shipments_monday"`
	MaxDailyShipmentsTuesday   int    `json:"max_daily_shipments_tuesday"`
	MaxDailyShipmentsWednesday int    `json:"max_daily_shipments_wednesday"`
	MaxDailyShipmentsThursday  int    `json:"max_daily_shipments_thursday"`
	MaxDailyShipmentsFriday    int    `json:"max_daily_shipments_friday"`
	MaxDailyShipmentsSaturday  int    `json:"max_daily_shipments_saturday"`
	MaxDailyShipmentsSunday    int    `json:"max_daily_shipments_sunday"`
}
func LoadSettings() (*Settings, error) {
	smtpPort, _ := strconv.Atoi(os.Getenv("SMTP_PORT"))
	shipmentsEnabled, _ := strconv.ParseBool(os.Getenv("SHIPMENTS_ENABLED"))
    shouldNotifyDriver, _ := strconv.ParseBool(os.Getenv("SHOULD_NOTIFY_DRIVER"))
	maxShipmentsMonday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_MONDAY"))
	maxShipmentsTuesday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_TUESDAY"))
	maxShipmentsWednesday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_WEDNESDAY"))
	maxShipmentsThursday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_THURSDAY"))
	maxShipmentsFriday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_FRIDAY"))
	maxShipmentsSaturday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_SATURDAY"))
	maxShipmentsSunday, _ := strconv.Atoi(os.Getenv("MAX_DAILY_SHIPMENTS_SUNDAY"))

	return &Settings{
		Port:                      os.Getenv("PORT"),
		AppEnv:                    os.Getenv("APP_ENV"),
		SMTPHost:                  os.Getenv("SMTP_HOST"),
		SMTPPort:                  smtpPort,
		SMTPUser:                  os.Getenv("SMTP_USER"),
		SMTPPassword:              os.Getenv("SMTP_PASSWORD"),
		SMTPFrom:                  os.Getenv("SMTP_FROM"),
		ShouldNotifyDriver    :    shouldNotifyDriver,
		ShipmentsEnabled:          shipmentsEnabled,
		MaxDailyShipmentsMonday:    maxShipmentsMonday,
		MaxDailyShipmentsTuesday:   maxShipmentsTuesday,
		MaxDailyShipmentsWednesday: maxShipmentsWednesday,
		MaxDailyShipmentsThursday:  maxShipmentsThursday,
		MaxDailyShipmentsFriday:    maxShipmentsFriday,
		MaxDailyShipmentsSaturday:  maxShipmentsSaturday,
		MaxDailyShipmentsSunday:    maxShipmentsSunday,
	}, nil
}
