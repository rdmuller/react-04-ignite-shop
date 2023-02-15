import { stripe } from "@/src/lib/stripe";
import { ImageContainer, ProductContainer, ProductDetails } from "@/src/styles/pages/product";
import { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import Stripe from "stripe";

interface ProductProps {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: string;
        description: string;        
    }
}

export default function Product( { product }: ProductProps ) {
    const { isFallback } = useRouter();
    //const { query } = useRouter();
    //<h1>Product {JSON.stringify(query)}</h1>

    if (isFallback) {
        return (
            <p>Carregando...</p>
        )
    }

    return (
        <ProductContainer>
            <ImageContainer>
                <Image src={product.imageUrl} width={520} height={480} alt="" />
            </ImageContainer>

            <ProductDetails>
                <h1>{product.name}</h1>
                <span>{product.price}</span>
                <p>{product.description}</p>
                <button>Comprar agora</button>
            </ProductDetails>
        </ProductContainer>
    );
}

export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [
            { params: { id: "" } },
        ],
        fallback: true,
    }
}

//export const getServerSideProps: GetServerSideProps<any, {id: string}> = async({ params }) => {    
export const getStaticProps: GetStaticProps<any, { id: string }> = async({ params }) => {
    const productId = params?.id ? params?.id : "";

    const product = await stripe.products.retrieve(productId, {
        expand: ["default_price"],
    });

    const price = product.default_price as Stripe.Price;

    console.log(JSON.stringify(product));

    return {
        props: {
            product: {
                id: product.id,
                name: product.name,
                imageUrl: product.images[0],
                price: Intl.NumberFormat("pt-BR", {
                    currency: "BRL",
                    style: "currency",
                }).format(price.unit_amount! / 100),
                description: product.description,
            }
        },
        revalidate: 60 * 60 * 1, // 1 hora
    }
}