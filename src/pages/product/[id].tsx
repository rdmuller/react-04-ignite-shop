import { stripe } from "@/src/lib/stripe";
import { ImageContainer, ProductContainer, ProductDetails } from "@/src/styles/pages/product";
import axios from "axios";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState } from "react";
import Stripe from "stripe";

interface ProductProps {
    product: {
        id: string;
        name: string;
        imageUrl: string;
        price: string;
        description: string;        
        defaultPriceId: string;
    }
}

export default function Product( { product }: ProductProps ) {
	const { isFallback } = useRouter();
	const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false);
	//const { query } = useRouter();
	//<h1>Product {JSON.stringify(query)}</h1>

	async function handleBuyProduct() {
		try {
			setIsCreatingCheckoutSession(true);
			const response = await axios.post("/api/checkout", {
				priceId: product.defaultPriceId,
			});

			const { checkoutUrl } = response.data;
			// é redirecionado da forma abaixo porque é uma rota externa
			window.location.href = checkoutUrl;
			// se fosse uma rota interna; seria usado assim:
			/*
                const router = useRouter();
                router.push('/checkout');
            */
		} catch (err) {
			setIsCreatingCheckoutSession(false);
			alert("Falha redirecionando ao checkout");
		} /* finally {....} */
	}

	if (isFallback) {
		return (
			<p>Carregando...</p>
		);
	}

	return (
		<>
			<Head>
				<title>{product.name} | Ignite Shop</title>
			</Head>

			<ProductContainer>
				<ImageContainer>
					<Image src={product.imageUrl} width={520} height={480} alt="" />
				</ImageContainer>

				<ProductDetails>
					<h1>{product.name}</h1>
					<span>{product.price}</span>
					<p>{product.description}</p>
					<button disabled={isCreatingCheckoutSession} onClick={handleBuyProduct}>Comprar agora</button>
				</ProductDetails>
			</ProductContainer>
		</>
	);
}

export const getStaticPaths: GetStaticPaths = async () => {
	return {
		paths: [
			{ params: { id: "" } },
		],
		fallback: true,
	};
};

//export const getServerSideProps: GetServerSideProps<any, {id: string}> = async({ params }) => {    
export const getStaticProps: GetStaticProps<any, { id: string }> = async({ params }) => {
	const productId = params?.id ? params?.id : "";

	const product = await stripe.products.retrieve(productId, {
		expand: ["default_price"],
	});

	const price = product.default_price as Stripe.Price;

	return {
		props: {
			product: {
				id: product.id,
				name: product.name,
				imageUrl: product.images[0],
				price: Intl.NumberFormat("pt-BR", {
					currency: "BRL",
					style: "currency",
				}).format((price.unit_amount ? price.unit_amount : 0) / 100),
				description: product.description,
				defaultPriceId: price.id,
			}
		},
		revalidate: 60 * 60 * 1, // 1 hora
	};
};