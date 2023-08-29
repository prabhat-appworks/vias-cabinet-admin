/* eslint-disable @next/next/no-img-element */
import React from "react";

function ProductRow({ product }) {
  return (
    <>
      <tr className="border-b border-[#cdcdcd]">
        <td className="font-normal px-5 py-4 text-sm flex items-center space-x-4">
          <img
            src={product.productImages[0].url}
            className="h-12 w-12 rounded-lg"
            alt=""
          />
          <span>{product.name}</span>
        </td>
        <td className="font-normal px-5 py-4 text-sm">{product.modelNumber}</td>

        <td className="font-normal px-5 py-4 text-sm">
          <button className="h-10 px-5 text-white rounded bg-[#023E8A]">
            Edit Product
          </button>
        </td>

        <td className="font-normal px-5 py-4 text-sm">
          <button
            onClick={async () => {
              if (!confirm("Are you sure you want to delete this product?"))
                return;

              let response = await fetch(`/api/product/delete/`, {
                method: "POST",
                body: JSON.stringify({
                  id: product._id,
                }),
              });
              let { success } = await response.json();
              if (success) {
                // window.location.reload();
              }
            }}
            className="h-10 w-10 bg-[#DA3A3A] rounded-md flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z"
                fill="white"
              />
            </svg>
          </button>
        </td>
      </tr>
    </>
  );
}

export default ProductRow;
