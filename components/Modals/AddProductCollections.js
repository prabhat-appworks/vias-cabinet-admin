import React, { useContext, useEffect } from "react";
import { Icon } from "@iconify/react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import DataTable from "@/components/Tables/DataTable";
import ProductDropdown from "../ProductDropdown";
import GlobalState from "@/context/GlobalStates";
import { v4 as uuidv4 } from "uuid";

function AddProductCollections({ open, setOpen }) {
    const fileInputRef = React.useRef();
    const [File, setFile] = React.useState([]);
    const [CSVData, setCSVData] = React.useState([]);
    const [ExcelData, setExcelData] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const { refreshProducts, products } = useContext(GlobalState);
    const [ProductId, setProductId] = React.useState('');
    const [product, setProduct] = React.useState();


    const handleProductSelect = async (selectedOption) => {
        setProductId(selectedOption.value);
        fetch(`/api/product/get-products?product_id=${selectedOption.value}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setProduct(data);
            })
            .catch(error => {
                console.error(error);
            });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const allowedFileTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            if (allowedFileTypes.includes(selectedFile.type)) {
                setFile([selectedFile]);
            } else {
                alert('Please upload a valid CSV, or Excel file.');
            }
        }
        setLoading(true);
        const fileType = selectedFile.type;

        try {
            if (fileType === "text/csv" || fileType === "application/vnd.ms-excel" || fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target.result;
                    if (fileType === "text/csv") {
                        const csvData = Papa.parse(result, { header: true }).data;
                        setCSVData(csvData);
                        setExcelData([]);
                    } else if (fileType === "application/vnd.ms-excel" || fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
                        const workbook = XLSX.read(result, { type: "binary" });
                        const sheetName = workbook.SheetNames[0];
                        const exceldata = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                        const convertedExcelData = convertExcelToJSON(exceldata);
                        setExcelData(convertedExcelData);
                        setCSVData([]);
                    }
                };
                reader.readAsBinaryString(selectedFile);
            } else {
                alert("Unsupported file type. Please upload a valid CSV, or Excel file.");
            }
        } catch (error) {
            console.error("Error reading file:", error);
            alert("Error reading file. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFile = () => {
        setFile([]);
        setCSVData([]);
        setExcelData([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    useEffect(() => {
        // console.log(ExcelData);
        // console.log(CSVData);
        // console.log(product);
    }, [ExcelData, CSVData, ProductId]);

    function convertExcelToJSON(excelData) {
        const headers = excelData[0];
        const jsonData = [];

        for (let i = 1; i < excelData.length; i++) {
            const row = excelData[i];
            const rowData = {};
            for (let j = 0; j < headers.length; j++) {
                rowData[headers[j]] = row[j];
            }
            jsonData.push(rowData);
        }
        return jsonData;
    }

    const handleSave = async () => {
        setLoading(true);
        if (ProductId == null || ProductId == undefined || ProductId == '') {
            alert('Please select a product');
            setLoading(false);
            return;
        }
        try {
            const productsData = CSVData.length > 0 ? CSVData : ExcelData;
            if (productsData.length === 0) { alert('Please Upload a file.'); return; }
            const productCol = Object.keys(productsData[0])
            const requiredProperties = ["Name", "Width", "Tag", "Price", "DiscountedPrice", "InStock"];
            const missingProperties = requiredProperties.filter(property => productCol.indexOf(property) === -1);
            if (missingProperties.length > 0) {
                alert(`${missingProperties.join(', ')} ${missingProperties.length > 1 ? 'are' : 'is'} required!`);
            } else {
                const updatedProd = {
                    id: ProductId,
                    collections: productsData.length > 0
                        ? productsData
                            .filter(item => item.Name !== '')
                            .map((item) => {
                                return {
                                    _id: uuidv4(),
                                    name: item?.Name,
                                    width: item?.Width,
                                    tag: item?.Tag,
                                    price: item?.Price,
                                    discountedPrice: item?.DiscountedPrice,
                                    inStock: item?.InStock,
                                    image: {
                                        url: `https://res.cloudinary.com/dccmraknj/image/upload/v1701226226/cabinet-photos/${item?.Image}`,
                                        id: `cabinet-photos/${item?.Image.split(".").pop()}`
                                    }
                                };
                            })
                        : [],
                };
                const createResponse = await fetch("/api/product/update-collection", {
                    method: "POST",
                    body: JSON.stringify(updatedProd),
                });
                const { success, message } = await createResponse.json();
                if (success) {
                    alert("Product collection updated Successfully")
                    console.log(success);
                    location.reload();
                } else {
                    alert(message);
                }
                setLoading(false);
            }
        } catch (error) {
            console.error("Error handling file data:", error);
            alert("Error handling file data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = (fileType) => {
        const publicPath = '/samples/';
        const fileName = (fileType === 'csv') ? 'sample-prod-collection.csv' : 'sample-prod-collection.xlsx';
        const fileUrl = `${publicPath}${fileName}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    function exportToCSV(data, fileName) {
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleExportCSV = async () => {
        const collectionsToExport = [];
        product?.collections.forEach((item) => {
            const newCollection = {
                Name: item?.name,
                Width: `${item?.width}`,
                Tag: item?.tag,
                Price: item?.price,
                DiscountedPrice: item?.discountedPrice,
                InStock: item?.inStock,
                Image: item.image.url.split('/').pop()
            };
            collectionsToExport.push(newCollection);
        });
        await exportToCSV(collectionsToExport, `${product.name}_collection_data.csv`);
    };

    return (
        <>
            {open && (
                <div className="fixed inset-0 h-full w-full bg-black/70 pt-10 pb-20 flex justify-center overflow-auto">
                    <div className="w-[90%] h-fit bg-[#D9D9D9] px-12 py-12 rounded-lg relative">
                        <button
                            onClick={() => {
                                setOpen(false);
                            }}
                            className="absolute top-5 right-5"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 36 36"
                            >
                                <path
                                    fill="currentColor"
                                    d="m19.41 18l8.29-8.29a1 1 0 0 0-1.41-1.41L18 16.59l-8.29-8.3a1 1 0 0 0-1.42 1.42l8.3 8.29l-8.3 8.29A1 1 0 1 0 9.7 27.7l8.3-8.29l8.29 8.29a1 1 0 0 0 1.41-1.41Z"
                                    className="clr-i-outline clr-i-outline-path-1"
                                />
                                <path fill="none" d="M0 0h36v36H0z" />
                            </svg>
                        </button>

                        <div className="mt-7">
                            <div className="text-[#1B1B1B] font-semibold text-[18px] flex justify-between">
                                <div>
                                    Add Product collections (csv, excel)
                                </div>

                                <div className="flex items-center">
                                    <label htmlFor="fileTypeDropdown">Download Sample: </label>
                                    <select
                                        id="fileTypeDropdown"
                                        className="text-[15px]"
                                        style={{ marginLeft: '8px', cursor: 'pointer' }}
                                        onChange={(e) => handleDownload(e.target.value)}
                                    >
                                        <option value="">Choose File</option>
                                        <option value="csv">CSV</option>
                                        <option value="excel">Excel</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-5 flex items-center space-x-3">
                                <div className="flex items-center text-sm pe-4 w-[100]">
                                    <ProductDropdown products={products} onSelect={handleProductSelect} />
                                </div>
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    className="mr-6 text-sm rounded-md px-6 h-12 bg-[#023E8A] text-[#fff] font-normal"
                                >
                                    <input
                                        onChange={handleFileChange}
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".csv, .xlsx"
                                        hidden
                                    />
                                    Upload collection file
                                </button>
                                {File.length > 0 && (
                                    <div className="flex items-center text-sm px-4">
                                        <span>
                                            {File[0].name.split(".")[0] +
                                                "." +
                                                File[0].name.split(".")[1]}
                                        </span>
                                        <button onClick={handleRemoveFile} className="ml-4 text-[#023E8A]">
                                            <Icon height={20} icon="ic:baseline-delete" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {!ProductId ? "" :
                            <button className="h-8 bg-[#133365] shrink-0 whitespace-nowrap mt-4 text-sm px-5 text-white rounded" onClick={handleExportCSV}>Export to CSV</button>
                        }

                        {CSVData.length != 0 && <DataTable data={CSVData} title={"Product Collection"} />}
                        {ExcelData.length != 0 && <DataTable data={ExcelData} title={"Product Collection"} />}

                        <div className="mt-10 flex justify-center">
                            <button
                                onClick={() => handleSave()}
                                className="bg-[#023E8A] text-white px-5 py-3 rounded-md"
                            >
                                Add collections
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="fixed inset-0 h-full w-full z-30 bg-black/50 flex items-center justify-center">
                    <div className="h-[120px] w-[120px] flex items-center justify-center bg-white rounded-md text-[#023E8A]">
                        <Icon height={50} icon="eos-icons:loading" />
                    </div>
                </div>
            )}
        </>
    );
}

export default AddProductCollections;
