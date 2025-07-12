package domain

import "go.mongodb.org/mongo-driver/bson/primitive"

type WaybillService interface {
	CreateWaybill(waybill Waybill, tokenClaims interface{}) (primitive.ObjectID, error)
	GetWaybill(waybillID string, tokenClaims interface{}) (Waybill, error)
	GetAllWaybill(
		tokenClaims interface{},
		status string,
		search string,
		cadeteId string,
		withdrawalAfter string,
		withdrawalBefore string,
		deliveryAfter string,
		deliveryBefore string,
		page int,
		limit int,
	) ([]Waybill, int, int, error)
	CreateStatusHistory(waybillID string, statusHistory SetStatusHistory, tokenClaims interface{}) error
	UpdateWaybill(waybillID string, waybill UpdateWaybill, tokenClaims interface{}) error
	CreatePayment(waybillID string, waybill Payment, tokenClaims interface{}) (primitive.ObjectID, error)
	DeleteWaybill(waybillID string, tokenClaims interface{}) error
	UpdateCadete(waybillID string, waybill Cadete, tokenClaims interface{}) error
	GetCountWithdrawalDate(fechaminimaStr string) ([]map[string]interface{}, error)
}
