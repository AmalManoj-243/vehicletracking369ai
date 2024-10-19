import { View, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { RoundedScrollContainer, SafeAreaView } from "@components/containers";
import { NavigationHeader } from "@components/Header";
import { TextInput as FormInput } from "@components/common/TextInput";
import { Button, LoadingButton } from "@components/common/Button";
import { DropdownSheet } from "@components/common/BottomSheets";
import { COLORS, FONT_FAMILY } from "@constants/theme";
import { fetchProductsDropdown } from "@api/dropdowns/dropdownApi";

const AddProductLines = ({ navigation, route }) => {
  const [dropdown, setDropdown] = useState({
    products: [],
  });
  const [searchText, setSearchText] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [formData, setFormData] = useState({
    productId: "",
    productName: "",
    suppliers: [],
    quantity: "",
    remarks: "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const ProductsData = await fetchProductsDropdown(searchText);
        setDropdown((prevDropdown) => ({
          ...prevDropdown,
          products: ProductsData?.map((data) => ({
            id: data._id,
            label: data.product_name?.trim(),
          })),
        }));
      } catch (error) {
        console.error("Error fetching Products dropdown data:", error);
      }
    };
    fetchProducts();
  }, []);

  const toggleBottomSheet = (type) => {
    setSelectedType(type);
    setIsVisible(!isVisible);
  };

  const renderBottomSheet = () => {
    let items = [];
    let fieldName = "";

    switch (selectedType) {
      case "Product Name":
        items = dropdown.products;
        fieldName = "products";
        break;
      default:
        return null;
    }
    return (
      <DropdownSheet
        isVisible={isVisible}
        items={items}
        title={selectedType}
        onClose={() => setIsVisible(false)}
        search
        onSearchText={(value) => setSearchText(value)}
        onValueChange={(value)=> {
          setSearchText('')
        }}
      />
    );
  };

  return (
    <SafeAreaView>
      <NavigationHeader
        title={"Add ProductLine"}
        onBackPress={() => navigation.goBack()}
      />
      <RoundedScrollContainer>
        <FormInput
          label={"Product"}
          placeholder={"Select Product"}
          dropIcon={"menu-down"}
          editable={false}
          required
          onPress={()=> toggleBottomSheet("Product Name")}
        />
        <FormInput
          label={"Quantity"}
          placeholder={"Enter quantity"}
          required
          editable={true}
        />
        <FormInput
          label={"Remarks"}
          placeholder={"Enter remarks"}
          required
          editable={true}
        />
        <FormInput
          label={"Supplier"}
          placeholder={"Add Suppliers"}
          dropIcon={"menu-down"}
          editable={false}
          required
        />
        <Button
          title={"Add Product"}
          width={"50%"}
          alignSelf={"center"}
          backgroundColor={COLORS.primaryThemeColor}
          // onPress={handleAddItems}
        />
        {renderBottomSheet()}
      </RoundedScrollContainer>
    </SafeAreaView>
  );
};

export default AddProductLines;
