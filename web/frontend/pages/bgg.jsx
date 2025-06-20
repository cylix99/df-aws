import React, { useState, useEffect } from "react";
import { Form, TextField, Card, Layout, Page, Button } from "@shopify/polaris";
import { XMLParser } from "fast-xml-parser"; // Import from fast-xml-parser
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

const CREATE_PRODUCT_MUTATION = `
  mutation CreateProduct($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_COLLECTIONS_QUERY = `
  query GetCollections($query: String) {
    collections(first: 10, query: $query) {
      edges {
        node {
          id
          handle
          title
        }
      }
    }
  }
`;

export default function Bgg() {
  const intFetch = useAuthenticatedFetch();

  const [gameData, setGameData] = useState({
    boardgameArtist: [],
    boardgameMechanic: [],
    boardgameDesigner: [],
    originalDescription: "",
    generatedDescription: "",
  });
  const [inputValue, setInputValue] = useState("");
  const [productId, setProductId] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [categoryNames, setCategoryNames] = useState([]);
  const [tags, setTags] = useState([]);

  /*const {
    data: collectionsData,
    loading: collectionsLoading,
    error: collectionsError,
  } = useQuery(GET_COLLECTIONS_QUERY, {
    variables: { query: `title:${categoryNames.join(" OR ")}` },
  });*/

  useEffect(() => {
    if (categoryNames) {
      intFetch("/api/call/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: GET_COLLECTIONS_QUERY,
          variables: { query: `title:${categoryNames.join(" OR ")}` },
        }),
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => response.json())
        .then((collectionsData) => {
          const collectionEdges = collectionsData?.collections.edges || [];
          const collectionIds = collectionEdges.map((edge) => edge.node.id);
          console.log({ collectionIds });
          console.log({ categoryNames });
          setCategoryIds(collectionIds);
        });
    }
  }, [categoryNames]);

  useEffect(() => {
    if (inputValue !== "") {
      fetchGameData(inputValue);
    }
  }, [inputValue]);

  const resetForm = () => {
    setInputValue("");
    setGameData({
      boardgameArtist: [],
      boardgameMechanic: [],
      boardgameDesigner: [],
      originalDescription: "",
      generatedDescription: "",
    });
    setCategoryIds([]);
    setCategoryNames([]);
  };

  const fetchGameData = async (id) => {
    const parser = new XMLParser({
      ignoreAttributes: false,
      parseAttributeValue: true,
      attributeNamePrefix: "",
    });
    try {
      const response = await fetch(
        `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`
      );

      const xmlData = await response.text();
      console.log({ xmlData });
      const result = parser.parse(xmlData);
      console.log({ result });

      const game = result.items.item;
      const newCategoryNames = game.link
        ?.filter((link) => link.type === "boardgamecategory")
        .map((link) => link.value);

      const newTags = game.link
        ?.filter((link) => link.type === "boardgamefamily")
        .map((link) => link.value.split(": ")[1]) // Extract value after ":"
        .filter((value) => !value.startsWith("Admin")); // Exclude values starting with "Admin"

      setTags(newTags);

      const publishers = game.link
        ?.filter((link) => link.type === "boardgamepublisher")
        .map((link) => link.value);

      let vendor = "";
      if (publishers && publishers.length > 0) {
        vendor = publishers[0];
      }

      setGameData({
        id: game.id || "",
        name: `${
          Array.isArray(game.name)
            ? (game.name.find((name) => name.type === "primary") || {}).value ||
              game.name
            : ""
        } Board Game`,
        originalDescription: game.description || "",
        maxPlayers: game.maxplayers?.value || "",
        minPlaytime: game.minplaytime?.value || "",
        maxPlaytime: game.maxplaytime?.value || "",
        minPlayers: game.minplayers?.value || "",
        recommendedAge: game.minage?.value || "",
        yearPublished: game.yearpublished?.value || "",
        complexity: game.statistics?.ratings?.averageweight?.value || "",
        boardgameArtist:
          game.link
            ?.filter((link) => link.type === "boardgameartist")
            .map((link) => link.value) || [],
        boardgameMechanic:
          game.link
            ?.filter((link) => link.type === "boardgamemechanic")
            .map((link) => link.value) || [],
        boardgameDesigner:
          game.link
            ?.filter((link) => link.type === "boardgamedesigner")
            .map((link) => link.value) || [],
        image: game.image || "",
        minAge: game.minage || "",
        vendor: vendor,
      });

      setCategoryNames(newCategoryNames);
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  };

  const handleInputChange = (value) => {
    setInputValue(value);
  };

  const handleViewProduct = () => {
    window.open(
      `https://puzzles-galore-shop.myshopify.com/admin/products/${productId}`
    );
    resetForm();
  };

  const handleAddToShopify = async () => {
    const gameDetails = gameData;

    if (gameDetails) {
      const difficultyLevels = [
        "Easy",
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
      ];
      const difficultyRating = parseFloat(gameDetails.complexity);
      const difficultyLevel =
        difficultyLevels[Math.floor(difficultyRating - 1)];

      //const categoryIds = await checkCollectionsAndGetIds(categoryNames);

      let playingTime;
      if (gameDetails.minPlaytime != gameDetails.maxPlaytime) {
        playingTime = `${gameDetails.minPlaytime}-${gameDetails.maxPlaytime} Mins`;
      } else {
        playingTime = `${gameDetails.maxPlaytime} Mins`;
      }
      const productInput = {
        title: gameDetails.name || "",
        descriptionHtml:
          gameDetails.generatedDescription ||
          gameDetails.originalDescription ||
          "",
        variants: [
          {
            price: "0.00",
            inventoryManagement: "SHOPIFY",
            harmonizedSystemCode: "9504908000",
            weight: 2,
            weightUnit: "KILOGRAMS",
          },
        ],
        published: true,
        images: [
          {
            src: gameDetails.image || "",
          },
        ],
        tags: tags,
        vendor: gameData.vendor,
        productCategory: {
          // version we are using is to old
          productTaxonomyNodeId: "gid://shopify/ProductTaxonomyNode/5185",
        },
        collectionsToJoin: categoryIds,
        metafields: [
          {
            namespace: "product",
            key: "supplier",
            value: "Asmodee",
            type: "single_line_text_field",
          },
          {
            namespace: "product",
            key: "bgg_id",
            value: gameDetails.id?.toString() || "",
            type: "number_integer",
          },
          {
            namespace: "product",
            key: "playing_time",
            value: `${gameDetails.minPlaytime}-${gameDetails.maxPlaytime} Mins`,
            type: "single_line_text_field",
          },
          {
            namespace: "product",
            key: "amount_of_players",
            value: JSON.stringify([
              `${gameDetails.minPlayers}-${gameDetails.maxPlayers} Players`,
            ]),
            type: "single_line_text_field",
          },
          {
            namespace: "product",
            key: "difficulty_rating",
            value: difficultyLevel,
            type: "single_line_text_field",
          },
          {
            namespace: "product",
            key: "year_released",
            value: gameDetails.yearPublished?.toString() || "",
            type: "number_integer",
          },
          {
            namespace: "product",
            key: "artist",
            value: JSON.stringify(gameDetails.boardgameArtist || ""),
            type: "list.single_line_text_field",
          },
          {
            namespace: "product",
            key: "game_mechanics",
            value: JSON.stringify(gameDetails.boardgameMechanic || ""),
            type: "list.single_line_text_field",
          },
          {
            namespace: "product",
            key: "designer",
            value: JSON.stringify(gameDetails.boardgameDesigner || ""),
            type: "list.single_line_text_field",
          },
          {
            namespace: "product",
            key: "recommended_age",
            value: gameDetails.recommendedAge
              ? `${gameDetails.recommendedAge}+`
              : "",
            type: "single_line_text_field",
          },
          {
            namespace: "my_fields",
            key: "date_first_available",
            value: new Date().toISOString().split("T")[0],
            type: "date",
          },
        ],
      };

      try {
        intFetch("/api/call/graphql", {
          method: "POST",
          body: JSON.stringify({
            query: CREATE_PRODUCT_MUTATION,
            variables: { input: productInput },
          }),
          headers: { "Content-Type": "application/json" },
        })
          .then((response_init) => response_init.json())
          .then((data) => {
            if (data.productCreate.product) {
              const productId = data.productCreate.product.id;
              console.log("Product created successfully!");
              console.log("Product ID:", data.productCreate.product.id);
              setProductId(productId.split("/").pop());
              resetForm();
            } else if (data.productCreate.userErrors.length > 0) {
              console.log("Error creating the product:");
              data.productCreate.userErrors.forEach((error) => {
                console.log(`${error.field}: ${error.message}`);
              });
            }
          });
      } catch (error) {
        console.error("An error occurred:", error);
      }
    }
  };

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card title="Board Game Data">
            <Card.Section>
              <Form>
                <TextField
                  label="Enter Game ID"
                  value={inputValue}
                  onChange={handleInputChange}
                  prefix={
                    gameData.image ? (
                      <img
                        src={gameData.image}
                        alt="Game Preview"
                        style={{ width: "100px", height: "100px" }}
                      />
                    ) : null
                  }
                  helpText="Enter the ID of the game you want to fetch"
                />
              </Form>
            </Card.Section>
            <Card.Section title="Game Details">
              <TextField label="ID" value={gameData.id} disabled />
              <TextField
                label="Name"
                value={gameData.name}
                onChange={(value) => setGameData({ ...gameData, name: value })}
              />
              <TextField
                label="Vendor"
                value={gameData.vendor}
                onChange={(value) =>
                  setGameData({ ...gameData, vendor: value })
                }
              />
              <TextField
                label="Original Description"
                value={gameData.originalDescription}
                onChange={(value) =>
                  setGameData({ ...gameData, originalDescription: value })
                }
                multiline
                rows={4}
              />
              <TextField
                label="Generated Description"
                value={gameData.generatedDescription}
                readOnly
                multiline
                rows={4}
              />
              <TextField
                label="Max Players"
                value={gameData.maxPlayers}
                onChange={(value) =>
                  setGameData({ ...gameData, maxPlayers: value })
                }
              />
              <TextField
                label="Min Playtime"
                value={gameData.minPlaytime}
                onChange={(value) =>
                  setGameData({ ...gameData, minPlaytime: value })
                }
              />
              <TextField
                label="Max Playtime"
                value={gameData.maxPlaytime}
                onChange={(value) =>
                  setGameData({ ...gameData, maxPlaytime: value })
                }
              />
              <TextField
                label="Min Players"
                value={gameData.minPlayers}
                onChange={(value) =>
                  setGameData({ ...gameData, minPlayers: value })
                }
              />
              <TextField
                label="Year Published"
                value={gameData.yearPublished}
                onChange={(value) =>
                  setGameData({ ...gameData, yearPublished: value })
                }
              />
              <TextField
                label="Complexity"
                value={gameData.complexity}
                onChange={(value) =>
                  setGameData({ ...gameData, complexity: value })
                }
              />
              <TextField
                label="Boardgame Artist"
                value={gameData.boardgameArtist.join(", ")}
                onChange={(value) =>
                  setGameData({
                    ...gameData,
                    boardgameArtist: value
                      .split(",")
                      .map((item) => item.trim()),
                  })
                }
              />
              <TextField
                label="Boardgame Mechanic"
                value={gameData.boardgameMechanic.join(", ")}
                onChange={(value) =>
                  setGameData({
                    ...gameData,
                    boardgameMechanic: value
                      .split(",")
                      .map((item) => item.trim()),
                  })
                }
              />
              <TextField
                label="Boardgame Designer"
                value={gameData.boardgameDesigner.join(", ")}
                onChange={(value) =>
                  setGameData({
                    ...gameData,
                    boardgameDesigner: value
                      .split(",")
                      .map((item) => item.trim()),
                  })
                }
              />
              <TextField
                label="Image"
                value={gameData.image}
                onChange={(value) => setGameData({ ...gameData, image: value })}
              />
            </Card.Section>
            <Card.Section>
              <Button primary onClick={handleAddToShopify}>
                Add to Shopify
              </Button>

              {productId && (
                <Button onClick={handleViewProduct} external>
                  View Product
                </Button>
              )}
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
