package domain

type Calculate struct {
    CompanyId           string `json:"company_id" bson:"company_id"`
    SenderState   string `json:"sender_state" bson:"sender_state"`
    SenderCity   string `json:"sender_city" bson:"sender_city"`
    SenderNeighborhood   string `json:"sender_neighborhood" bson:"sender_neighborhood"`
	SenderAddress  string `json:"sender_address" bson:"sender_address"`
	RecipientState   string `json:"recipient_state" bson:"recipient_state"`
    RecipientCity   string `json:"recipient_city" bson:"recipient_city"`
    RecipientNeighborhood    string `json:"recipient_neighborhood" bson:"recipient_neighborhood"`
	RecipientAddress  string `json:"recipient_address" bson:"recipient_address"`
	PackageDetail      []PackageDetail `json:"package_detail" bson:"package_detail"`
}
type PackageDetail struct {
	Type           string `json:"type" bson:"type"`
    PackageNumber  string            `json:"package_number" bson:"package_number"`
    Description    string            `json:"description" bson:"description"`
    Weight         float64           `json:"weight" bson:"weight"`
    Quantity       float64           `json:"quantity" bson:"quantity"`
    Price          float64           `json:"Price" bson:"Price"`
    Dimensions     PackageDimensions `json:"dimensions" bson:"dimensions"`
}
type PackageDimensions struct {
    Length float64 `json:"length" bson:"length"`
    Width  float64 `json:"width" bson:"width"`
    Height float64 `json:"height" bson:"height"`
}
type Address struct {
    Country      string `json:"country" bson:"country"`
    State        string `json:"state" bson:"state"`
    City         string `json:"city" bson:"city"`
    Address      string `json:"address" bson:"address"`
    Postcode     string    `json:"postcode" bson:"postcode"`
}
type Result struct {
  Price      float64 `json:"price" bson:"price"`
  ShippingZone      string `json:"shipping_zone" bson:"shipping_zone"`
}

