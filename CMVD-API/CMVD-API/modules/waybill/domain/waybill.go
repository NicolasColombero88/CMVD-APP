package domain

import (
    "time"
    "go.mongodb.org/mongo-driver/bson/primitive"
    "errors"
    companyModel "api/modules/companies/domain"
)
type GuideStatus string

const (
    GuideGenerated           GuideStatus = "generated"
    GuidePreparing           GuideStatus = "preparing"
    GuidePickedUp            GuideStatus = "picked_up"
    GuideInTransit           GuideStatus = "in_transit"
    GuideAtHub               GuideStatus = "at_hub"
    GuideOutForDelivery      GuideStatus = "out_for_delivery"
    GuideDelivered           GuideStatus = "delivered"
    GuideDeliveryFailed      GuideStatus = "delivery_failed"
    GuideOutForRedelivery     GuideStatus = "out_for_redelivery"
    GuideRejectedByRecipient GuideStatus = "rejected_by_recipient"
    GuideReturnedToSender    GuideStatus = "returned_to_sender"
    GuideHeldAtCustoms       GuideStatus = "held_at_customs"
    GuideCanceled            GuideStatus = "canceled"
    GuideLost                GuideStatus = "lost"
    GuideDamaged             GuideStatus = "damaged"
    GuideAwaitingPickup      GuideStatus = "awaiting_pickup"
    GuideOnHoldForPayment    GuideStatus = "on_hold_for_payment"
    GuideRescheduled         GuideStatus = "rescheduled"
)

type PaymentStatus string
const (
    PaymentPending          PaymentStatus = "pending"
    PaymentProcessing       PaymentStatus = "processing"
    PaymentCompleted        PaymentStatus = "completed"
    PaymentFailed           PaymentStatus = "failed"
    PaymentCanceled         PaymentStatus = "canceled"
    PaymentRefunded         PaymentStatus = "refunded"
    PaymentPartiallyRefunded PaymentStatus = "partially_refunded"
    PaymentAuthorized       PaymentStatus = "authorized"
    PaymentFraudReview      PaymentStatus = "fraud_review"
)
type Waybill struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    CompanyId       primitive.ObjectID                 `json:"company_id" bson:"company_id"`
    BranchId       primitive.ObjectID                 `json:"branch_id" bson:"branch_id"`
    CadeteId       primitive.ObjectID                 `json:"cadete_id" bson:"cadete_id"`
    CompanyName        string                 `json:"company_name" bson:"company_name"`
    PickupDatetime     string                 `json:"pickup_datetime" bson:"pickup_datetime"`
    ExternalId         string                 `json:"external_id" bson:"external_id"`
    CarrierId          string `json:"carrier_id" bson:"carrier_id"`
    WaybillNumber      string            `json:"waybill_number" bson:"waybill_number"`
    SiteUrl      string            `json:"site_url" bson:"site_url"`
    ShipmentDate       time.Time         `json:"shipment_date" bson:"shipment_date"`
    Sender             Contact           `json:"sender" bson:"sender"`
    Receiver           Contact           `json:"receiver" bson:"receiver"`
    PackageDetails     []PackageDetail   `json:"package_details" bson:"package_details"`
    StatusHistory      []StatusHistory   `json:"status_history" bson:"status_history"`
    DeliveryDate       time.Time         `json:"delivery_date" bson:"delivery_date"`
    DeliveryHour       string            `json:"delivery_hour" bson:"delivery_hour"`
    DeliverySignature  string            `json:"delivery_signature" bson:"delivery_signature"`
    DeliveryNotes      string            `json:"delivery_notes" bson:"delivery_notes"`
    ShippingMethod     string            `json:"shipping_method" bson:"shipping_method"`
    ShippingCost       float64           `json:"shipping_cost" bson:"shipping_cost"`
    BaseShippingCost  float64  `json:"base_shipping_cost" bson:"base_shipping_cost"`
    ProfitMargin       float64           `json:"profit_margin" bson:"profit_margin"`
    OperatingExpenses  float64           `json:"operating_expenses" bson:"operating_expenses"` 
    Status             string            `json:"status" bson:"status"`
    PaymentStatus      string            `json:"payment_status" bson:"payment_status"`
    PaymentReference   string            `json:"payment_reference" bson:"payment_reference"`
    PaymentMethod   string               `json:"payment_method" bson:"payment_method"`
    AdditionalServices []string          `json:"additional_services" bson:"additional_services"`
    CustomsDeclaration  CustomsDeclaration `json:"customs_declaration" bson:"customs_declaration"`
    CarrierInformation  CarrierInformation `json:"carrier_information" bson:"carrier_information"`
    ReceiverAddress   string            `json:"receiver_address" bson:"receiver_address"`
    SenderAddress      string            `json:"sender_address" bson:"sender_address"`
    GoodsValue         float64          `json:"goods_value" bson:"goods_value"`
    WhoPays            string            `json:"who_pays" bson:"who_pays"`
    Notes              string            `json:"notes" bson:"notes"`
    WithdrawalDate   time.Time        `json:"withdrawal_date" bson:"withdrawal_date"`
    CreatedAt          time.Time         `json:"created_at" bson:"created_at"`
    UpdatedAt          time.Time         `json:"updated_at" bson:"updated_at"`
}

type UpdateWaybill struct {
    CompanyId       primitive.ObjectID                 `json:"company_id" bson:"company_id"`
    BranchId       primitive.ObjectID                 `json:"branch_id" bson:"branch_id"`
    CadeteId       primitive.ObjectID                 `json:"cadete_id" bson:"cadete_id"`
    CompanyName        string                 `json:"company_name" bson:"company_name"`
    WaybillNumber      string            `json:"waybill_number" bson:"waybill_number"`
    PickupDatetime     string                 `json:"pickup_datetime" bson:"pickup_datetime"`
    ShipmentDate       time.Time         `json:"shipment_date" bson:"shipment_date"`
    Sender             Contact           `json:"sender" bson:"sender"`
    Receiver           Contact           `json:"receiver" bson:"receiver"`
    PackageDetails     []PackageDetail   `json:"package_details" bson:"package_details"`
    DeliveryDate       time.Time         `json:"delivery_date" bson:"delivery_date"`
    DeliveryHour       string            `json:"delivery_hour" bson:"delivery_hour"`
    DeliverySignature  *string            `json:"delivery_signature" bson:"delivery_signature"`
    DeliveryNotes      *string            `json:"delivery_notes" bson:"delivery_notes"`
    ShippingMethod     string            `json:"shipping_method" bson:"shipping_method"`
    ShippingCost       float64           `json:"shipping_cost" bson:"shipping_cost"`
    BaseShippingCost  float64  `json:"base_shipping_cost" bson:"base_shipping_cost"`
    Status             *string            `json:"status" bson:"status"`
    PaymentStatus      *string            `json:"payment_status" bson:"payment_status"`
    AdditionalServices []string          `json:"additional_services" bson:"additional_services"`
    ReceiverAddress   string            `json:"receiver_address" bson:"receiver_address"`
    SenderAddress      string            `json:"sender_address" bson:"sender_address"`
    CustomsDeclaration  *CustomsDeclaration `json:"customs_declaration" bson:"customs_declaration"`
    CarrierInformation *CarrierInformation `json:"carrier_information" bson:"carrier_information"`
    WhoPays            string            `json:"who_pays" bson:"who_pays"` 
    Notes              string            `json:"notes" bson:"notes"` 
    UpdatedAt          time.Time         `json:"updated_at" bson:"updated_at"`
}

type Contact struct {
    Name           string `json:"name" bson:"name"`
    DocumentType   string        `json:"document_type" bson:"document_type"`
    DocumentNumber   string     `json:"document_number" bson:"document_number"`
    Address   Address            `json:"address" bson:"address"`
    Email          string `json:"email" bson:"email"`
    Phone          string `json:"phone" bson:"phone"`
}

type Address struct {
    ShippingZoneId string `json:"shipping_zone_id" bson:"shipping_zone_id"`
    Country      string `json:"country" bson:"country"`
    State        string `json:"state" bson:"state"`
    City         string `json:"city" bson:"city"`
    Neighborhood string `json:"neighborhood" bson:"neighborhood"`
    Street       string `json:"street" bson:"street"`
    Postcode     string    `json:"postcode" bson:"postcode"`
}

type PackageDetail struct {
    PackageNumber  string            `json:"package_number" bson:"package_number"`
    Description    string            `json:"description" bson:"description"`
    Weight         float64           `json:"weight" bson:"weight"`
    Quantity       float64           `json:"quantity" bson:"quantity"`
    Dimensions     PackageDimensions `json:"dimensions" bson:"dimensions"`
}

type PackageDimensions struct {
    Length float64 `json:"length" bson:"length"`
    Width  float64 `json:"width" bson:"width"`
    Height float64 `json:"height" bson:"height"`
}

type SetStatusHistory struct {
    CompanyId  string    `json:"company_id" bson:"company_id"`
    Status     string    `json:"status" bson:"status"`
    StatusDate time.Time `json:"status_date" bson:"status_date"`
    Location   string    `json:"location" bson:"location"`
}
type StatusHistory struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    Status     string    `json:"status" bson:"status"`
    StatusDate time.Time `json:"status_date" bson:"status_date"`
    Location   string    `json:"location" bson:"location"`
}

type CustomsDeclaration struct {
    DeclarationNumber string  `json:"declaration_number" bson:"declaration_number"`
    Description       string  `json:"description" bson:"description"`
    Value             float64 `json:"value" bson:"value"`
    Currency          string  `json:"currency" bson:"currency"`
    CustomsStatus     string  `json:"customs_status" bson:"customs_status"`
}

type CarrierInformation struct {
    CarrierName     string `json:"carrier_name" bson:"carrier_name"`
    TrackingNumber  string `json:"tracking_number" bson:"tracking_number"`
    ContactInfo     string `json:"contact_info" bson:"contact_info"`
    UserId     string `json:"user_id" bson:"user_id"`
}
type Cadete struct {
    CadeteId       primitive.ObjectID                 `json:"cadete_id" bson:"cadete_id"`
    UpdatedAt          time.Time         `json:"updated_at" bson:"updated_at"`
}
type User struct {
	ID        primitive.ObjectID `json:"id" bson:"_id"`
	CompanyId string             `json:"companyId,omitempty" bson:"companyId,omitempty"`
	Name      string             `json:"name" bson:"name"`
    Email     string             `json:"email" bson:"email"`
	Role      string             `json:"role" bson:"role"`
	Phone     string             `json:"phone" bson:"phone"`
	Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
	Address   Address            `json:"address" bson:"address"`
	Status    string             `json:"status" bson:"status"`
}
type Company struct {
    ID        primitive.ObjectID `json:"id" bson:"_id"`
    UserId    primitive.ObjectID `json:"user_id" bson:"user_id"`
    UserName  string  `json:"user_name" bson:"user_name"`
    Name      string             `json:"name" bson:"name"`
    Email     string             `json:"email" bson:"email"`
    Phone     string             `json:"phone" bson:"phone"`
    Whatsapp  string             `json:"whatsapp" bson:"whatsapp"`
}
func CreateNewWaybill(newWaybillInput Waybill, companyId primitive.ObjectID, company companyModel.Company) (*Waybill, error) {
    date := time.Now()
    if newWaybillInput.BranchId == primitive.NilObjectID{
        if len(company.Branches) == 0 {
            return nil, errors.New("la compañía no tiene sucursales")
        }
        newWaybillInput.BranchId = company.Branches[0].ID
        newWaybillInput.Sender.Address = Address{
            ShippingZoneId: "",
            Country:        "UR",
            State:          company.Branches[0].Address.State,
            City:           company.Branches[0].Address.City,
            Neighborhood:   company.Branches[0].Address.Neighborhood,
            Street:         company.Branches[0].Address.Street,
            Postcode:       company.Branches[0].Address.Postcode,
        }
    }else{
        branchFound := false
        for _, branch := range company.Branches {
            if branch.ID == newWaybillInput.BranchId {
                newWaybillInput.Sender.Address = Address{
                    Country:        "UR",
                    State:          branch.Address.State,
                    City:           branch.Address.City,
                    Neighborhood:   branch.Address.Neighborhood,
                    Street:         branch.Address.Street,
                    Postcode:       branch.Address.Postcode,
                }
                branchFound = true
                break
            }
        }
        if !branchFound {
            return nil, errors.New("la sucursal proporcionada no existe en la compañía")
        }
    }
    if newWaybillInput.Sender.Name == "" {
        newWaybillInput.Sender.Name = company.Name
    }
    if newWaybillInput.Sender.Phone == "" {
        newWaybillInput.Sender.Phone = company.Phone
    }
	if newWaybillInput.Sender.Email == "" {
		newWaybillInput.Sender.Email = company.Email
	}
    SenderAddress:=newWaybillInput.Sender.Address.Street+","+newWaybillInput.Sender.Address.Neighborhood+","+newWaybillInput.Sender.Address.City
    ReceiverAddress:=newWaybillInput.Receiver.Address.Street+","+newWaybillInput.Receiver.Address.Neighborhood+","+newWaybillInput.Receiver.Address.City
    return &Waybill{
        ID:                 primitive.NewObjectID(),
        CompanyId:          companyId,
        BranchId:           newWaybillInput.BranchId,
        CompanyName:        company.Name,
        PickupDatetime:    newWaybillInput.PickupDatetime,
        ExternalId:         newWaybillInput.ExternalId,
        CarrierId:          newWaybillInput.CarrierId,
        WaybillNumber:      newWaybillInput.WaybillNumber,
        SiteUrl:newWaybillInput.SiteUrl,
        ShipmentDate:       newWaybillInput.ShipmentDate,
        Sender:             newWaybillInput.Sender,
        Receiver:           newWaybillInput.Receiver,
        SenderAddress:SenderAddress,
        ReceiverAddress:ReceiverAddress,
        PackageDetails:     newWaybillInput.PackageDetails,
        StatusHistory:      newWaybillInput.StatusHistory,
        DeliveryDate:       newWaybillInput.DeliveryDate,
        DeliveryHour:       newWaybillInput.DeliveryHour,
        DeliverySignature:  newWaybillInput.DeliverySignature,
        DeliveryNotes:      newWaybillInput.DeliveryNotes,
        ShippingMethod:     newWaybillInput.ShippingMethod,
        ShippingCost:       newWaybillInput.ShippingCost,
        Status:             newWaybillInput.Status,
        PaymentStatus:      newWaybillInput.PaymentStatus,
        AdditionalServices: newWaybillInput.AdditionalServices,
        CustomsDeclaration: newWaybillInput.CustomsDeclaration,
        CarrierInformation: newWaybillInput.CarrierInformation,
        GoodsValue:newWaybillInput.GoodsValue,
        WhoPays:newWaybillInput.WhoPays,
        Notes:newWaybillInput.Notes,
        WithdrawalDate:newWaybillInput.WithdrawalDate,
        CreatedAt:          date,
        UpdatedAt:          date,
    }, nil
}
func CreateStatusHistory(setStatusHistory SetStatusHistory) (*StatusHistory, error) {
    date := time.Now()
    id := primitive.NewObjectID()
    return &StatusHistory{
        ID:                id,
        Status:            setStatusHistory.Status,
        Location:          setStatusHistory.Location,
        StatusDate:         date,
    }, nil
}
type UpdateWaybillFields struct {
    WaybillNumber      *string            `json:"waybill_number" bson:"waybill_number"`
    DeliverySignature  *string            `json:"deliverySignature" bson:"deliverySignature"`
    Status             *string            `json:"status" bson:"status"`
    CustomsDeclaration *CustomsDeclaration `json:"CustomsDeclaration" bson:"CustomsDeclaration"`
    CarrierInformation *CarrierInformation `json:"carrier_information" bson:"carrier_information"`
    UpdatedAt          *time.Time         `json:"updated_at" bson:"updated_at"`
}
type Payment struct {
    PaymentStatus      string            `json:"payment_status" bson:"payment_status"`
    PaymentReference   string            `json:"payment_reference" bson:"payment_reference"`
    PaymentMethod   string               `json:"payment_method" bson:"payment_method"`
    UpdatedAt          *time.Time         `json:"updated_at" bson:"updated_at"`
}
func CreatePayment(waybill Payment) (map[string]interface{}, error) {
    if waybill.PaymentStatus == "" {
        return nil, errors.New("el campo PaymentStatus es requerido")
    }
    if waybill.PaymentReference == "" {
        return nil, errors.New("el campo PaymentReference es requerido")
    }
    if waybill.PaymentMethod == "" {
        return nil, errors.New("el campo PaymentMethod es requerido")
    }
    currentTime := time.Now()
    payment := Payment{
        PaymentStatus:    waybill.PaymentStatus,
        PaymentReference: waybill.PaymentReference,
        PaymentMethod:    waybill.PaymentMethod,
        UpdatedAt:       &currentTime,
    }
    result := map[string]interface{}{
        "payment_status":    payment.PaymentStatus,
        "payment_reference": payment.PaymentReference,
        "payment_method":    payment.PaymentMethod,
        "updated_at":       payment.UpdatedAt,
    }
    return result, nil
}
func UpdateWaybillWithInput(newUpdateWaybill UpdateWaybill,company companyModel.Company) (*UpdateWaybill, error) {
    date := time.Now()
    if newUpdateWaybill.BranchId == primitive.NilObjectID{
        if len(company.Branches) == 0 {
            return nil, errors.New("la compañía no tiene sucursales")
        }
        newUpdateWaybill.BranchId = company.Branches[0].ID
        newUpdateWaybill.Sender.Address = Address{
            ShippingZoneId: "",
            Country:        "UR",
            State:          company.Branches[0].Address.State,
            City:           company.Branches[0].Address.City,
            Neighborhood:   company.Branches[0].Address.Neighborhood,
            Street:         company.Branches[0].Address.Street,
            Postcode:       company.Branches[0].Address.Postcode,
        }
    }else{
        branchFound := false
        for _, branch := range company.Branches {
            if branch.ID == newUpdateWaybill.BranchId {
                newUpdateWaybill.Sender.Address = Address{
                    Country:        "UR",
                    State:          branch.Address.State,
                    City:           branch.Address.City,
                    Neighborhood:   branch.Address.Neighborhood,
                    Street:         branch.Address.Street,
                    Postcode:       branch.Address.Postcode,
                }
                branchFound = true
                break
            }
        }
        if !branchFound {
            return nil, errors.New("la sucursal proporcionada no existe en la compañía")
        }
    }
    if newUpdateWaybill.Sender.Name == "" {
       newUpdateWaybill.Sender.Name = company.Name
    }
    if newUpdateWaybill.Sender.Phone == "" {
       newUpdateWaybill.Sender.Phone = company.Phone
    }
    SenderAddress:=newUpdateWaybill.Sender.Address.Street+","+newUpdateWaybill.Sender.Address.Neighborhood+","+newUpdateWaybill.Sender.Address.City
    ReceiverAddress:=newUpdateWaybill.Receiver.Address.Street+","+newUpdateWaybill.Receiver.Address.Neighborhood+","+newUpdateWaybill.Receiver.Address.City
    return &UpdateWaybill{
        CompanyId:          company.ID,
        BranchId:           newUpdateWaybill.BranchId,
        CompanyName:        company.Name,
        PickupDatetime:     newUpdateWaybill.PickupDatetime,
        ShipmentDate:       newUpdateWaybill.ShipmentDate,
        Sender:             newUpdateWaybill.Sender,
        Receiver:           newUpdateWaybill.Receiver,
        SenderAddress:      SenderAddress,
        ReceiverAddress:    ReceiverAddress,
        PackageDetails:     newUpdateWaybill.PackageDetails,
        DeliveryDate:       newUpdateWaybill.DeliveryDate,
        DeliveryHour:       newUpdateWaybill.DeliveryHour,
        DeliverySignature:  newUpdateWaybill.DeliverySignature,
        DeliveryNotes:      newUpdateWaybill.DeliveryNotes,
        ShippingMethod:     newUpdateWaybill.ShippingMethod,
        ShippingCost:       newUpdateWaybill.ShippingCost,
        Status:             newUpdateWaybill.Status,
        PaymentStatus:      newUpdateWaybill.PaymentStatus,
        AdditionalServices: newUpdateWaybill.AdditionalServices,
        CustomsDeclaration: newUpdateWaybill.CustomsDeclaration,
        CarrierInformation: newUpdateWaybill.CarrierInformation,
        WhoPays:newUpdateWaybill.WhoPays,
        Notes:newUpdateWaybill.Notes,
        UpdatedAt:          date,
    }, nil
}
func UpdateWaybillWithInput2(status string) (map[string]interface{}, error) {
    date := time.Now()
    newUpdatedShippingZone := make(map[string]interface{})
    newUpdatedShippingZone["status"] = status
    newUpdatedShippingZone["updated_at"] = date
    return newUpdatedShippingZone, nil
}
func SetCadete(cadete Cadete, status string) map[string]interface{} {
    date := time.Now()
    newUpdated := make(map[string]interface{})
    newUpdated["cadete_id"] = cadete.CadeteId
    newUpdated["updated_at"] = date
    if status == "Procesando" {
        newUpdated["status"] = "Aceptado"
    }
    return newUpdated
}


